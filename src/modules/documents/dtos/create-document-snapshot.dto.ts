import { IsDefined } from 'class-validator';

export class CreateDocumentSnapshotDto {
  @IsDefined()
  snapshot: unknown;
}
