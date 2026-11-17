export interface OpenAlexAuthor {
  id?: string;
  display_name?: string;
}

export interface OpenAlexAuthorship {
  author?: OpenAlexAuthor;
  raw_author_name?: string;
  author_position?: string;
}

export interface OpenAlexSourceInfo {
  id?: string;
  display_name?: string;
  publisher?: string;
  type?: string;
  issn_l?: string;
}

export interface OpenAlexLocation {
  is_oa?: boolean;
  landing_page_url?: string;
  pdf_url?: string;
  source?: OpenAlexSourceInfo;
}

export interface OpenAlexBiblio {
  volume?: string;
  issue?: string;
  first_page?: string;
  last_page?: string;
}

export interface OpenAlexWorkItem {
  id: string; // e.g. "https://openalex.org/W2741809807"
  doi?: string; // e.g. "https://doi.org/10.1038/s41586-020-2003-7"
  title?: string;
  publication_year?: number;
  publication_date?: string;
  authorships?: OpenAlexAuthorship[];
  primary_location?: OpenAlexLocation;
  type?: string;
  biblio?: OpenAlexBiblio;
  abstract_inverted_index?: Record<string, number[]> | null;
  cited_by_count?: number;
}

export interface OpenAlexResponse {
  meta?: {
    count?: number;
    page?: number;
    per_page?: number;
  };
  results?: OpenAlexWorkItem[];
}
