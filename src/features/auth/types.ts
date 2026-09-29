/** Public user shape returned by the API (mirrors server PublicUser). */
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}
