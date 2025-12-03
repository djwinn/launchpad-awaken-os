export interface ParsedOutput {
  linkHub: string;
  leadMagnet: string;
  landingPage: string;
  thankYouPage: string;
  bookingPage: string;
  yourOffer: string;
  welcomeEmail: string;
  intakeForm: string;
  emails: { title: string; content: string }[];
}

export function parseOutputDocument(content: string): ParsedOutput | null {
  if (!content.includes('YOUR COMPLETE MINI-FUNNEL COPY')) {
    return null;
  }

  const sections: ParsedOutput = {
    linkHub: '',
    leadMagnet: '',
    landingPage: '',
    thankYouPage: '',
    bookingPage: '',
    yourOffer: '',
    welcomeEmail: '',
    intakeForm: '',
    emails: [],
  };

  // Extract sections using regex patterns
  const extractSection = (startPattern: string, endPatterns: string[]): string => {
    const startRegex = new RegExp(`## ${startPattern}[\\s\\S]*?(?=\\n---\\n|$)`, 'i');
    const match = content.match(startRegex);
    if (!match) return '';
    
    let result = match[0];
    // Remove the header
    result = result.replace(new RegExp(`^## ${startPattern}\\s*\\n?`, 'i'), '').trim();
    return result;
  };

  // Split content by section headers
  const sectionRegex = /## (LINK HUB|LEAD MAGNET PDF|LANDING PAGE|THANK YOU PAGE|BOOKING PAGE|YOUR OFFER[^#]*|WELCOME EMAIL|INTAKE FORM QUESTIONS|EMAIL SEQUENCE)/gi;
  const parts = content.split(sectionRegex);

  // Find each section
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]?.trim();
    if (!part) continue;

    const nextPart = parts[i + 1]?.trim() || '';
    
    if (part.toUpperCase() === 'LINK HUB') {
      sections.linkHub = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase() === 'LEAD MAGNET PDF') {
      sections.leadMagnet = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase() === 'LANDING PAGE') {
      sections.landingPage = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase() === 'THANK YOU PAGE') {
      sections.thankYouPage = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase() === 'BOOKING PAGE') {
      sections.bookingPage = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase().startsWith('YOUR OFFER')) {
      sections.yourOffer = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase() === 'WELCOME EMAIL') {
      sections.welcomeEmail = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase() === 'INTAKE FORM QUESTIONS') {
      sections.intakeForm = cleanSection(nextPart);
      i++;
    } else if (part.toUpperCase() === 'EMAIL SEQUENCE') {
      sections.emails = parseEmails(nextPart);
      i++;
    }
  }

  return sections;
}

function cleanSection(text: string): string {
  // Remove trailing separator lines and "NEXT STEPS" section
  return text
    .split(/\n---\n/)[0]
    .split(/={10,}/)[0]
    .split(/## EMAIL SEQUENCE/i)[0]
    .split(/## WELCOME EMAIL/i)[0]
    .split(/## INTAKE FORM/i)[0]
    .trim();
}

function parseEmails(emailSection: string): { title: string; content: string }[] {
  const emails: { title: string; content: string }[] = [];
  
  // Split by email headers
  const emailRegex = /### Email (\d+):\s*([^\n]+)/gi;
  const parts = emailSection.split(emailRegex);
  
  for (let i = 1; i < parts.length; i += 3) {
    const emailNum = parts[i];
    const emailTitle = parts[i + 1]?.trim() || '';
    let emailContent = parts[i + 2]?.trim() || '';
    
    // Clean up content - remove next email header if present
    emailContent = emailContent.split(/### Email \d+:/i)[0].trim();
    // Remove trailing separators
    emailContent = emailContent.split(/\n---\n/)[0].split(/={10,}/)[0].trim();
    
    if (emailNum && emailTitle) {
      emails.push({
        title: `Email ${emailNum}: ${emailTitle}`,
        content: emailContent,
      });
    }
  }
  
  return emails;
}

export function isOutputComplete(content: string): boolean {
  return content.includes('YOUR COMPLETE MINI-FUNNEL COPY');
}
