// Universal Document Parser
// Identifies formats by binary signature and internal ZIP structure

/**
 * Robust PPTX text extraction using DOMParser for XML traversal.
 * Scans slides, charts, diagrams, and notes.
 */
export async function extractTextFromPPTX(file: File): Promise<string[]> {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const parser = new DOMParser();
  const allText: string[] = [];

  // 1. Slides (The primary content)
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.startsWith('ppt/slides/slide'))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)![0]);
      const bNum = parseInt(b.match(/\d+/)![0]);
      return aNum - bNum;
    });

  // 2. Diagrams/SmartArt (Hidden text)
  const diagramFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/diagrams/data'));
  
  // 3. Charts
  const chartFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/charts/chart'));

  // 4. Notes (Speaker notes)
  const notesFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/notesSlides/notesSlide'));

  const allFilesToScan = [...slideFiles, ...diagramFiles, ...chartFiles, ...notesFiles];

  for (const name of allFilesToScan) {
    const xmlContent = await zip.file(name)?.async('string');
    if (!xmlContent) continue;

    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    // a:t is the standard text tag for Office Open XML
    const tNodes = xmlDoc.getElementsByTagName("a:t");
    let slideText = "";
    
    for (let i = 0; i < tNodes.length; i++) {
        const text = tNodes[i].textContent?.trim();
        if (text) slideText += text + " ";
    }

    if (slideText.trim()) {
      allText.push(slideText.trim());
    }
  }

  return allText;
}

export async function extractTextFromPDF(file: File): Promise<string[]> {
  // @ts-ignore
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  // Set verbosity to 0 (Errors only) to prevent terminal clutter
  const loadingTask = pdfjs.getDocument({ 
    data: arrayBuffer,
    verbosity: 0 
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(text);
  }

  return pages;
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = (await import('mammoth')).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Universal Entry Point:
 * Detects format by Binary Signature (Magic Numbers) and ZIP content.
 */
export async function parseDocument(file: File): Promise<{ content: string | string[], type: string }> {
  // 1. Extract extension robustly
  const fileName = file.name.trim();
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 
    ? fileName.slice(lastDotIndex + 1).toLowerCase().trim() 
    : '';

  // 2. Sample the binary header (Magic Numbers)
  const buffer = await file.slice(0, 8).arrayBuffer();
  const header = new Uint8Array(buffer);
  const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  console.log('📄 [Parser] Inspecting:', { fileName, hex, extension });

  // 3. Identify PDF (%PDF-)
  if (hex.startsWith('25504446')) {
    return { content: await extractTextFromPDF(file), type: 'pdf' };
  }

  // 4. Identify ZIP-based (MODERN Office Docs: .pptx, .docx)
  if (hex.startsWith('504B0304')) {
    const JSZip = (await import('jszip')).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Look for indicators inside the ZIP folder structure
    const isPowerpoint = Object.keys(zip.files).some(name => name.startsWith('ppt/'));
    const isWord = Object.keys(zip.files).some(name => name.startsWith('word/'));

    if (isPowerpoint) {
      return { content: await extractTextFromPPTX(file), type: 'pptx' };
    }
    if (isWord) {
      return { content: await extractTextFromDOCX(file), type: 'docx' };
    }

    // Default fallback within ZIP: If unidentified but matches ZIP header, use extension clues
    if (extension === 'pptx' || extension === 'ppt') return { content: await extractTextFromPPTX(file), type: 'pptx' };
    if (extension === 'docx' || extension === 'doc') return { content: await extractTextFromDOCX(file), type: 'docx' };
    
    // Last resort fallback for ZIPs
    return { content: await extractTextFromPPTX(file), type: 'pptx' };
  }

  // 5. Identify LEGACY Office Binary (Magic Number: D0 CF 11 E0)
  if (hex.startsWith('D0CF11E0')) {
    throw new Error('This is a legacy binary format (.ppt or .doc). These older formats cannot be read directly by the browser. Please open the file in PowerPoint/Word and "Save As" a modern .pptx or .docx file.');
  }

  // 6. Last chance: Fallback strictly to extension if signature was non-standard
  switch (extension) {
    case 'pdf': return { content: await extractTextFromPDF(file), type: 'pdf' };
    case 'docx': return { content: await extractTextFromDOCX(file), type: 'docx' };
    case 'pptx': 
    case 'ppt': 
      // Some institutions rename files weirdly; if it says it's powerpoint, try the zip extractor
      try {
        return { content: await extractTextFromPPTX(file), type: 'pptx' };
      } catch (e) {
        throw new Error(`The file claims to be a PowerPoint (.${extension}), but it uses an older binary format. Please convert it to .pptx for full compatibility.`);
      }
    case 'doc': 
      throw new Error(`The .doc format (legacy) is not directly supported. Please convert it to .docx.`);
    default: 
      console.warn('🛑 [Parser] Unrecognized format:', { hex, extension, fileName });
      throw new Error(`Unrecognized document format (detected: .${extension || 'unknown'}). Please upload a modern PDF, DOCX, or PPTX file.`);
  }
}
