export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remover fragmentos y parámetros de consulta innecesarios
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

export function isSubdomain(url: string, domain: string): boolean {
  const urlDomain = getDomain(url);
  if (!urlDomain) return false;
  
  return urlDomain === domain || urlDomain.endsWith('.' + domain);
}

export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = getDomain(url1);
  const domain2 = getDomain(url2);
  return domain1 === domain2;
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"]+/gi;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}