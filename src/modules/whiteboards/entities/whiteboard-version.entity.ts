import { Entity, Property, BlobType, ManyToOne } from '@mikro-orm/core';
import { CoreEntity } from '@/common/entities/core.entity';
import { Whiteboard } from './whiteboard.entity';

@Entity()
export class WhiteboardVersion extends CoreEntity {
  @ManyToOne(() => Whiteboard)
  whiteboard!: Whiteboard;

  @Property({ type: BlobType })
  content!: Buffer;

  @Property({ nullable: true })
  name?: string;

  constructor(partial: Partial<WhiteboardVersion>) {
    super();
    Object.assign(this, partial);
  }
}
