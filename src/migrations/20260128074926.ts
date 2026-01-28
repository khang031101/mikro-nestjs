import { Migration } from '@mikro-orm/migrations';

export class Migration20260128074926 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "card" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "slug" varchar(255) not null, "display_name" varchar(255) not null, "job_title" varchar(255) null, "company" varchar(255) null, "bio" text null, "avatar_url" varchar(255) null, "cover_url" varchar(255) null, "phone_number" varchar(255) null, "email" varchar(255) null, "website" varchar(255) null, "bank_name" varchar(255) null, "bank_account_name" varchar(255) null, "bank_account_number" varchar(255) null, "theme_config" jsonb null, "is_active" boolean not null default true, "view_count" int not null default 0, "user_id" varchar(255) not null, constraint "card_pkey" primary key ("id"));`);
    this.addSql(`alter table "card" add constraint "card_slug_unique" unique ("slug");`);

    this.addSql(`create table "card_link" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "label" varchar(255) not null, "url" varchar(255) not null, "type" varchar(255) not null default 'custom', "icon_key" varchar(255) null, "is_active" boolean not null default true, "order" int not null default 0, "card_id" varchar(255) not null, constraint "card_link_pkey" primary key ("id"));`);

    this.addSql(`alter table "card" add constraint "card_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "card_link" add constraint "card_link_card_id_foreign" foreign key ("card_id") references "card" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "card_link" drop constraint "card_link_card_id_foreign";`);

    this.addSql(`drop table if exists "card" cascade;`);

    this.addSql(`drop table if exists "card_link" cascade;`);
  }

}
