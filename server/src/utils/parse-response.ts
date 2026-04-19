export type ParsedResponse = {
  json: any | null;
  text: string;
};

export async function parseResponse(res: Response): Promise<ParsedResponse> {
  const text = await res.text();

  try {
    return {
      json: JSON.parse(text),
      text,
    };
  } catch {
    return {
      json: null,
      text,
    };
  }
}