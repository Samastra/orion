// Document text extraction utilities
// All imports are dynamic to prevent SSR issues

export async function extractTextFromPDF(file: File): Promise<string[]> {
  // Dynamic import to avoid SSR DOMMatrix errors
  // @ts-ignore
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
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

export async function extractTextFromPPTX(file: File): Promise<string[]> {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.startsWith('ppt/slides/slide'))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)![0]);
      const bNum = parseInt(b.match(/\d+/)![0]);
      return aNum - bNum;
    });
  
  const slides: string[] = [];
  for (const name of slideFiles) {
    const content = await zip.file(name)!.async('string');
    const text = content.match(/<a:t>([^<]*)<\/a:t>/g)
      ?.map(match => match.replace(/<[^>]*>/g, ''))
      .join(' ') || '';
    slides.push(text);
  }

  return slides;
}

export async function parseDocument(file: File): Promise<{ content: string | string[], type: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return { content: await extractTextFromPDF(file), type: 'pdf' };
    case 'docx':
      return { content: await extractTextFromDOCX(file), type: 'docx' };
    case 'pptx':
      return { content: await extractTextFromPPTX(file), type: 'pptx' };
    default:
      throw new Error('Unsupported file type');
  }
}
