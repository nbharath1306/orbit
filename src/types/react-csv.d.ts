declare module 'react-csv' {
  import React from 'react';

  interface CSVLinkProps {
    data: unknown[];
    filename?: string;
    headers?: unknown[];
    target?: string;
    [key: string]: unknown;
  }

  export const CSVLink: React.FC<CSVLinkProps>;
  export default CSVLink;
}
