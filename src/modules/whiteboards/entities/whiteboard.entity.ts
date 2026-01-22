import { Entity, Property, BlobType } from '@mikro-orm/core';
import { CoreEntity } from '@/common/entities/core.entity';

@Entity()
export class Whiteboard extends CoreEntity {
  @Property()
  name!: string;

  @Property({ type: BlobType, nullable: true })
  content?: Buffer;

  constructor(partial: Partial<Whiteboard>) {
    super();
    Object.assign(this, partial);
  }
}
