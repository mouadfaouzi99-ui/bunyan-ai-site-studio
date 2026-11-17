# Bunyan — AI Website Studio

Bunyan is a mobile-friendly, Arabic-first website builder for small businesses. It turns a short business brief into an editable one-page website draft for restaurants, cafés, hotels/riads, and professional portfolios. The interface is in Moroccan Arabic; generated sites can be requested in Arabic, Moroccan Darija, French, or English.

## Features

- AI-assisted website copy: headline, introduction, service/menu ideas, FAQs, and a search description.
- Live desktop/mobile preview with warm, minimal, luxury, and playful visual styles.
- Business details for location, phone, WhatsApp, Instagram, opening hours, and owner-supplied menu/service items.
- Google Maps place link plus an optional Google Maps embed URL. If no embed is provided, the generated site displays a Maps link from the business location.
- Genuine customer testimonials added by the business owner, plus an optional link for customers to leave a Google review. The AI does not create testimonials or ratings.
- WhatsApp pre-order or booking inquiry with a pre-filled message. A customer can send a name, service/item, preferred time, and notes to the business number.
- Save projects in browser `localStorage`; export a standalone HTML page for review and hosting.
- Contact-us form for people requesting a website. It opens WhatsApp or an email app using a destination configured by the site owner; the lead is not stored on a server.
- Basic `LocalBusiness` structured data in exported pages, populated only with information entered by the owner.

## Architecture

- `public/` contains the builder UI and client-side project/preview logic.
- `src/worker.js` serves the static assets and a server-side Cloudflare Workers AI endpoint.
- `wrangler.jsonc` configures static assets and the Workers AI binding.

The browser never receives a model-provider API key. Project drafts and manually entered reviews are kept in the current browser only. The Worker returns constrained JSON copy; user content is rendered as text and never executed as generated HTML.

## Run locally

Requirements: Node.js/npm, a Cloudflare account, and Wrangler authentication for AI-backed generation.

```bash
npx wrangler@latest login
npx wrangler@latest dev
```

The AI binding is configured as a remote binding for local development. AI calls use the connected Cloudflare account and may consume account usage/credits. The frontend, editor, and preview can be explored without invoking AI, but generation requires the Worker and an available Workers AI model.

## Deploy

```bash
npx wrangler@latest deploy
```

The Worker is configured for a `workers.dev` address. Attach a custom domain separately if desired. Before making the AI endpoint broadly available, review Cloudflare limits and billing for the account. The endpoint has a small per-IP in-memory rate limit; this is a basic safeguard, not a durable quota or billing cap.

## Maps and review policy

The builder does not scrape Google Maps or copy reviews automatically. Owners can enter genuine reviews they are authorized to publish and provide a Google review link for new feedback. Google Maps Embed API requests require an API key; restrict any key to the appropriate API and website referrers before publishing. The project accepts a Google Maps embed URL when supplied, and otherwise links visitors to Maps. See [Google Maps Embed API setup](https://developers.google.com/maps/documentation/embed/quickstart).

Google Places API review data is not imported by this project. The official Place Details API can return up to five reviews for a place, requires a Places API key, and requires applicable attribution and review links; review fields may have different billing. See [Place Details and reviews](https://developers.google.com/maps/documentation/places/web-service/place-details) and [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies).

WhatsApp links use the official click-to-chat URL format. They open a pre-filled message in WhatsApp; they do not send automatically or provide a database for incoming orders. See [WhatsApp click to chat](https://faq.whatsapp.com/5913398998672934).

## Search and accuracy notes

Exported pages include basic local-business structured data when the owner supplies details. This can help search engines understand a page, but does not guarantee indexing, a ranking, a map listing, or a rich result. Owners should review AI-written copy, opening hours, prices, services, and business details before publishing. Google’s [Local Business structured data guidance](https://developers.google.com/search/docs/appearance/structured-data/local-business) describes supported business fields and eligibility requirements.

## Privacy and limitations

- AI generation sends the business brief and selected fields to the Worker and Cloudflare Workers AI.
- Saved projects and manually entered testimonials stay in the local browser until exported or cleared.
- The contact-us form opens the user's email or WhatsApp app; Bunyan does not receive or retain submissions.
- WhatsApp orders and booking requests are sent only after the visitor chooses to send the pre-filled message.
- A static exported site has no user-account system, database, payment checkout, or automatic moderation.
- Verify all generated content and obtain permission for customer names, quotes, and images before publication.

## License

No license is included. All rights remain with the copyright holder unless a license is added.
