'use client';

import { useState, useEffect } from 'react';

export function useFileProcessor(file?: File | null) {
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.arrayBuffer) {
      setDocHtml(null);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || !ext) return;

    setInternalLoading(true);
    setError(null);

    const processFile = async () => {
      try {
        if (ext === 'docx') {
          const mammoth = (await import('mammoth')).default;
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocHtml(result.value);
        } else if (ext === 'pptx') {
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

          let html = '';
          for (let i = 0; i < slideFiles.length; i++) {
            const slideFile = zip.file(slideFiles[i]);
            if (slideFile) {
              const slideContent = await slideFile.async('string');
              const texts = slideContent.match(/<a:t>([^<]*)<\/a:t>/g)
                ?.map(match => match.replace(/<[^>]*>/g, ''))
                .filter(t => t.trim()) || [];
              
              html += `
                <div class="slide-card">
                  <div class="slide-header">
                    <span class="slide-num">${i + 1}</span>
                    <span class="slide-label">Slide ${i + 1}</span>
                  </div>
                  ${texts.map(t => `<p class="slide-text">${t}</p>`).join('')}
                </div>
              `;
            }
          }
          setDocHtml(html);
        } else {
          setError(`Unsupported file type: .${ext}`);
        }
      } catch (err) {
        console.error('Failed to process document:', err);
        setError('Failed to load document. Please try another file.');
      } finally {
        setInternalLoading(false);
      }
    };

    processFile();
  }, [file]);

  return { docHtml, internalLoading, error };
}
