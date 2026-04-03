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
  const buffer = await file.slice(0, 4).arrayBuffer();
  const header = new Uint8Array(buffer);
  const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  // 1. Identify PDF
  if (hex === '25504446') {
    return { content: await extractTextFromPDF(file), type: 'pdf' };
  }

  // 2. Identify ZIP-based (Office Docs)
  if (hex === '504B0304') {
    const JSZip = (await import('jszip')).default;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Look for indicators inside the ZIP
    const isPowerpoint = Object.keys(zip.files).some(name => name.startsWith('ppt/'));
    const isWord = Object.keys(zip.files).some(name => name.startsWith('word/'));

    if (isPowerpoint) {
      return { content: await extractTextFromPPTX(file), type: 'pptx' };
    }
    if (isWord) {
      return { content: await extractTextFromDOCX(file), type: 'docx' };
    }

    // Default fallback: Try PPTX extraction if unidentified
    return { content: await extractTextFromPPTX(file), type: 'pptx' };
  }

  // 3. Last chance: fallback to extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return { content: await extractTextFromPDF(file), type: 'pdf' };
    case 'docx': return { content: await extractTextFromDOCX(file), type: 'docx' };
    case 'pptx': return { content: await extractTextFromPPTX(file), type: 'pptx' };
    default: throw new Error('Unrecognized document signature or extension');
  }
}
