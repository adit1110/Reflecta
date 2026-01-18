# Reflecta

**Reflecta** is a privacy-first identity reflection app that helps people see how their emotional identity shifts over time.

Users write a daily journal entry. Behind the scenes, AI extracts emotional signals, an in-house algorithm turns those signals into a daily **Mental Health / Identity Score (MLH)**, and the result is visualized as a calm timeline of change.

> Reflecta does **not** diagnose, treat, or give medical advice.  
> It is a **mirror — not a therapist**.

---

## The Idea (Pitch)

Most people won’t talk about their mental state — but they **will write**.

Reflecta turns private journaling into:

- A daily identity score  
- A visual timeline of emotional shifts  
- Gentle self-reflection written in the user’s own tone  

This helps users recognize patterns and moments that mattered — **without judgment, labels, or clinical framing**.

---

## How It Works

**Write → Analyze → Score → Visualize → Reflect**

1. User writes a journal entry  
2. Google Gemini extracts emotional signals (sentiment, stress, energy, etc.)  
3. A custom algorithm calculates a daily MLH score (0–100)  
4. Scores are plotted over time  
5. Significant changes are highlighted as *Identity Shifts*  
6. AI generates a short self-reflective message (not advice)

---

## Tech Stack

- **Next.js** (App Router)  
- **Tailwind CSS**  
- **Supabase** (Postgres + Auth)  
- **Google Gemini API**  
- **Recharts**  

---

## How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/adit1110/Reflecta.git
cd Reflecta/reflecta
```

### 2. Install Dependencies 
```bash
npm install
```

### 3. Add environment variables
Create a .env.local file in /refl
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Start the development server
```bash
npm run dev
```

The app will run at: http://localhost:3000


## Ethics & Safety

Reflecta is built with strict ethical boundaries:

- No diagnosis or clinical labeling  
- No therapy or medical advice  
- No medical claims  
- Explicit user consent for AI analysis  
- Full user control over personal data  
- Complete data deletion supported

