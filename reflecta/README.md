# How to run

## Have installed

* Git
* Node.js

---

## Getting started

```bash
git clone https://github.com/adit1110/Reflecta.git
cd reflecta
```

## Set up environmetn variables

You need to get environment variables from 
* Supabase
* Gemini
* D-ID

```bash
NEXT_PUBLIC_SUPABASE_URL=supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase-key
# Dev-only seed endpoint protection
SEED_SECRET=secret_seed
SUPABASE_SERVICE_ROLE_KEY=supabase_server_role_key
GEMINI_API_KEY=gemini_key
DID_API_KEY=d-id_key
DID_SOURCE_URL=d-id_url
DID_VOICE_ID=d-id_voice(ex. en-US-JennyNeural)
```

## Get everything installed

```bash
npm install
```

## Start

```bash
npm run dev
```
