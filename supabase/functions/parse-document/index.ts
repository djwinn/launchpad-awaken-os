import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    
    console.log('Processing file:', fileName, 'Type:', fileType);

    // Handle text-based files directly
    if (
      fileType === 'text/plain' ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.csv')
    ) {
      const text = await file.text();
      return new Response(
        JSON.stringify({ text, fileName: file.name }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For DOC/DOCX files, extract text using mammoth-like approach
    if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // For DOCX files, extract text from the XML content
      if (fileName.endsWith('.docx') || fileType.includes('openxmlformats')) {
        try {
          // DOCX is a ZIP file, we'll extract document.xml
          const { BlobReader, ZipReader, TextWriter } = await import("https://deno.land/x/zipjs@v2.7.32/index.js");
          
          const blob = new Blob([uint8Array]);
          const zipReader = new ZipReader(new BlobReader(blob));
          const entries = await zipReader.getEntries();
          
          let documentText = '';
          
          for (const entry of entries) {
            if (entry.filename === 'word/document.xml') {
              const writer = new TextWriter();
              const xmlContent = await entry.getData!(writer);
              
              // Extract text from XML, removing tags
              documentText = xmlContent
                .replace(/<w:p[^>]*>/g, '\n') // Paragraph breaks
                .replace(/<w:br[^>]*>/g, '\n') // Line breaks
                .replace(/<w:tab[^>]*>/g, '\t') // Tabs
                .replace(/<[^>]+>/g, '') // Remove all XML tags
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
                .trim();
              
              break;
            }
          }
          
          await zipReader.close();
          
          if (documentText) {
            return new Response(
              JSON.stringify({ text: documentText, fileName: file.name }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (zipError) {
          console.error('DOCX parsing error:', zipError);
        }
      }
      
      // Fallback: try to extract readable text from binary
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let rawText = decoder.decode(uint8Array);
      
      // Extract readable portions (basic approach for .doc files)
      const readableText = rawText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (readableText.length > 100) {
        return new Response(
          JSON.stringify({ text: readableText, fileName: file.name }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Could not extract text from this document format. Please try copying and pasting the content directly.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return new Response(
        JSON.stringify({ error: 'PDF parsing is not supported. Please copy and paste the content directly, or convert to a text file.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported file type: ${fileType || fileName}. Supported formats: .txt, .md, .csv, .doc, .docx` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document parsing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to parse document' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
