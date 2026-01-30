import { Migration } from '@mikro-orm/migrations';

export class Migration20260130042654 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "member" drop constraint "member_user_id_foreign";`);
    this.addSql(`alter table "member" drop constraint "member_role_id_foreign";`);

    this.addSql(`alter table "member" add constraint "member_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "member" add constraint "member_role_id_foreign" foreign key ("role_id") references "role" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "member" drop constraint "member_user_id_foreign";`);
    this.addSql(`alter table "member" drop constraint "member_role_id_foreign";`);

    this.addSql(`alter table "member" add constraint "member_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "member" add constraint "member_role_id_foreign" foreign key ("role_id") references "role" ("id") on update cascade;`);
  }

}
