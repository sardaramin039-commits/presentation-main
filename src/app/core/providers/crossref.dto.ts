export interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
  ORCID?: string;
  sequence?: string;
}

export interface CrossrefDateParts {
  'date-parts': number[][];
}

export interface CrossrefWorkItem {
  DOI: string;
  title?: string[];
  author?: CrossrefAuthor[];
  issued?: CrossrefDateParts;
  'published-print'?: CrossrefDateParts;
  'published-online'?: CrossrefDateParts;
  'container-title'?: string[];
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  URL?: string;
  type?: string;
  abstract?: string;
  score?: number;
}

export interface CrossrefResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: {
    'total-results'?: number;
    items?: CrossrefWorkItem[];
  };
}

export interface CrossrefWorkSingleResponse {
  status: string;
  message: CrossrefWorkItem;
}
