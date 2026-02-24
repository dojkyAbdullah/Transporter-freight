create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text check (role in ('COMPANY', 'TRANSPORTER')) not null,
  company_name text,
  created_at timestamp with time zone default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references users(id),
  raw_request_text text not null,
  formatted_request_text text, -- AI cleaned version
  status text default 'OPEN',
  created_at timestamp with time zone default now()
);
create table transporter_replies (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id),
  transporter_id uuid references users(id),
  raw_reply_text text not null,
  created_at timestamp with time zone default now(),
  unique (request_id, transporter_id)
);
create table structured_rates (
  id uuid primary key default gen_random_uuid(),
  transporter_name text,
  origin_city text,
  destination_city text,
  vehicle_type text,
  weight_tons numeric,
  rate_pkr numeric,
  availability_date date,
  remarks text,
  created_at timestamp with time zone default now()
);


SELECT * FROM requests

ALTER TABLE transporter_replies
DROP CONSTRAINT transporter_replies_request_id_fkey;

ALTER TABLE transporter_replies
ADD CONSTRAINT transporter_replies_request_id_fkey
FOREIGN KEY (request_id)
REFERENCES requests(id)
ON DELETE CASCADE;

SELECT * FROM requests

SELECT  * FROM transporter_replies

ALTER TABLE requests
ADD COLUMN loading_date date,
ADD COLUMN movement_type text; -- 'PORT' | 'UPCOUNTRY'


ALTER TABLE requests
ADD COLUMN port_commodity text,
ADD COLUMN container_size text,        -- 20ft / 40ft
ADD COLUMN container_count integer,
ADD COLUMN weight_per_container numeric,
ADD COLUMN import_export text,          -- Import / Export
ADD COLUMN port_lane text,
ADD COLUMN cutoff_date date,
ADD COLUMN special_instructions text;

ALTER TABLE requests
ADD COLUMN upcountry_commodity text,
ADD COLUMN truck_type text,             -- Container / Flatbed
ADD COLUMN bed_size text,               -- 20ft / 40ft
ADD COLUMN total_weight numeric,
ADD COLUMN upcountry_lane text,
ADD COLUMN customer_name text,
ADD COLUMN upcountry_instructions text;

ALTER TABLE requests
ADD COLUMN form_data jsonb;

ALTER TABLE transporter_replies
DROP COLUMN raw_reply_text;

ALTER TABLE transporter_replies
ADD COLUMN rate_pkr numeric,
ADD COLUMN availability_date date,
ADD COLUMN remarks text;

-- transporter can update same request
ALTER TABLE transporter_replies
DROP CONSTRAINT transporter_replies_request_id_transporter_id_key;

ALTER TABLE transporter_replies
ADD CONSTRAINT unique_transporter_request
UNIQUE (request_id, transporter_id);

SELECT * from transporter_replies

SELECT * FROM requests

ALTER TABLE requests
ADD COLUMN reference_number text;
