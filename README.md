ArenaAI Hub 2026 🏟️✨

ArenaAI Hub 2026 is a cutting-edge, dual-portal smart stadium command center and fan companion app. It leverages Google's Gemini Generative AI models to revolutionize venue operations, crowd safety, and the spectator experience for the FIFA World Cup 2026.

🏆 Built for Virtual Promptewar Challenge 4: Smart Stadiums & Tournament Operations.

📖 Overview

Managing an 80,000-seat stadium during a World Cup requires split-second decision-making and seamless communication. ArenaAI Hub solves this by providing two interconnected experiences in one application:

Operations Tactical Command: A desktop-class dashboard for venue staff to monitor live crowd heatmaps, dispatch security, and instantly generate multilingual PA announcements using AI.

Fan Companion App Simulator: A virtual smartphone interface for fans inside the stadium, featuring a conversational AI concierge, accessible routing, eco-friendly food ordering, and custom AI souvenir generation.

✨ Key Features

🛡️ Operations Command Center (Staff Portal)

AI Tactical Co-Pilot (Gemini Text): Staff can input live incident reports (e.g., "Gate B is overcrowded") and the AI instantly generates a categorized dispatch plan, crowd rerouting strategies, and bilingual emergency scripts.

Multilingual Audio Synthesizer (Gemini TTS): Converts the AI-generated emergency scripts into clear, authoritative audio broadcasts in real-time, allowing operators to choose different AI voice profiles.

Interactive Crowd Heatmap: A clickable stadium blueprint. Clicking on different gates or concourses simulates live IoT sensor diagnostics and triggers instant UI alerts.

Live Telemetry Dashboards: Visualizes ingress rates, queue wait times, and eco-waste sorting data using dynamic Recharts.

📱 Fan Experience Portal (Spectator App)

ArenaAI Concierge Chat: A real-time chat interface where fans can ask for seating directions, bathroom locations, or request rule translations into Spanish, French, or Arabic.

AI Climate Souvenir Badge Creator (Gemini Image): Fans can input custom text prompts to design and download their own personalized, eco-friendly digital World Cup souvenir badges.

Dynamic Accessibility Rerouting: A toggle that automatically prioritizes wheelchair-friendly pathways and elevator networks on the user's digital ticket.

Sustainable Eats Ordering: Pre-order plant-based/low-carbon food items and track the active carbon footprint savings directly in the app.

🚀 How to Use the App

The app features a top navigation bar to switch between the two main portals:

1. Operations Intelligence (Ops Tab)

Monitor the Map: Click on the colored sectors (Gates A, B, C, D) on the stadium blueprint to run simulated sensor checks.

Run AI Simulations: In the "AI Tactical Co-Pilot" panel on the right, click a predefined scenario or type your own emergency. Click Run AI.

Synthesize Audio: Once the AI generates a plan and a broadcast script, click the Synthesize Broadcast button to hear the audio announcement.

2. Fan Experience (Fan Tab)

Chat with the AI: Use the simulated smartphone screen to type questions like "Where is the nearest ADA elevator to section 104?" or "Translate 'Main Exit' to Spanish".

Generate a Souvenir: Tap the AI Badge icon on the phone menu, type a creative prompt (e.g., "A futuristic soccer ball covered in solar panels"), and click generate to create a custom image.

Order Eco-Food: Tap the Eco Food tab to simulate pre-ordering sustainable concessions and view carbon impact scores.

🛠️ Tech Stack

Frontend Framework: React 18

Styling: Tailwind CSS

Icons: Lucide React

Data Visualization: Recharts

AI Integration:

gemini-3-flash-preview (Text / JSON routing)

gemini-2.5-flash-preview-tts (Text-to-Speech audio generation)

gemini-3.1-flash-image-preview / imagen-3.0 (Image Generation)
link:
https://fifaworldcup2026-mu.vercel.app/

(Note: To use the AI features locally outside of the Promptewar environment, you will need to replace the empty apiKey="" strings in App.jsx with a valid Google Gemini API Key).
