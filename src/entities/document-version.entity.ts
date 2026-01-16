import { TenantEntity } from '@/common/entities';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Document } from './document.entity';

@Entity()
export class DocumentVersion extends TenantEntity {
  @ManyToOne(() => Document)
  document!: Document;

  @Property({ type: 'bytea' })
  updateBinary!: Buffer;

  @Property()
  version!: number;
}
