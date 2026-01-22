export interface ITokenPayload {
  sub: string;
  name?: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
