# SubTrack

A personal subscription tracker that shows what you spend on recurring payments and what is due next. It runs entirely in the browser: no backend, no account, no dependencies. Your data is stored in your browser's LocalStorage, and can be exported to and restored from a file.

SubTrack is a learning project built with plain HTML, CSS and JavaScript, with the goal of understanding the fundamentals (modules, state, dates, validation, persistence) instead of hiding them behind a framework.

<!-- Add a screenshot here once you have one: ![SubTrack dashboard](docs/dashboard.png) -->

## Features

- **Dashboard** with monthly and annual spending, active subscription count, next payment, upcoming payments (next 30 days), spending by category, and the most expensive subscriptions
- **Add, edit, pause, resume, cancel and delete** subscriptions
- **Billing cycles:** weekly, monthly, quarterly, every 6 months, yearly. Costs are shown per month and per year whatever the cycle
- **Next payment dates** calculated from the start date, including month-end and leap-year cases
- **Search, filters and sorting** by name, category, status, cost or next payment
- **Export and import** of all data as a JSON backup file, with validation before anything is replaced
- **Dark theme by default, with an optional light theme** that is remembered between visits
- **Responsive layout** for desktop and mobile
- **Sample data** on first launch, which can be cleared without touching your own entries
- **Euro (€) by default**, with the code structured so more currencies can be added later

## Getting started

No build step or installation is needed. The code uses ES modules, which browsers will not load when `index.html` is opened directly from disk, so it has to be served over HTTP.

**With VS Code:**

1. Install the **Live Server** extension.
2. Open the project folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.

**Or with any static server**, for example:

```
python -m http.server 8000
```

then open `http://localhost:8000`.

## Backing up your data

Open the **Data** page to export everything to a file named `subtrack-backup-YYYY-MM-DD.json`, and to restore from one. Importing **replaces** all current data with the contents of the file, after a confirmation. The file is checked first and is imported completely or not at all: if any entry is invalid, nothing changes and the first problems are listed.

## How it works

### Project structure

```
subtrack/
├── index.html
├── css/
│   ├── styles.css           theme variables, layout, cards, lists
│   └── forms.css            buttons, form and data page styling
└── js/
    ├── main.js              entry point and router
    ├── constants.js         billing cycles, statuses, currency, locale
    ├── dates.js             date parsing and arithmetic
    ├── money.js             price text <-> cents conversion
    ├── validation.js        rules for what a valid subscription is
    ├── storage.js           reading and writing LocalStorage
    ├── subscriptions.js     add / update / delete operations
    ├── backup.js            building and validating backup files
    ├── calculations.js      costs, next payment dates, statistics
    ├── sampleData.js        demo subscriptions for first launch
    ├── format.js            display formatting (money, dates, percentages)
    ├── theme.js             dark/light theme toggle
    └── ui/
        ├── dom.js               helpers for building elements and downloads
        ├── dashboard.js         dashboard page
        ├── subscriptionList.js  list with search, filters, sorting
        ├── subscriptionForm.js  add and edit form
        └── dataPage.js          export and import page
```

The code is split into layers, and each file has one job:

- **Storage, validation and backup** know nothing about the screen.
- **Calculations** know nothing about storage or the screen.
- **Formatting** turns raw values into text and does no math.
- **The UI** only displays what the other layers return.

### Data model

Each subscription is a plain object:

```js
{
  id: "…",                 // unique, never changes
  name: "Netflix",
  priceCents: 1299,        // 12.99 EUR stored as an integer
  currency: "EUR",
  billingCycle: "monthly", // weekly | monthly | quarterly | semiannual | annual
  startDate: "2026-01-15", // a real payment date; later payments are calculated from it
  category: "Streaming",
  status: "active",        // active | paused | cancelled
  notes: "",
  isSample: true           // optional: marks demo data
}
```

A backup file wraps a list of these as `{ app: "subtrack", version: 1, exportedAt, subscriptions }`.

### Design decisions

- **Money is stored as integer cents.** JavaScript numbers are floating point (`0.1 + 0.2` is `0.30000000000000004`), and small errors add up across many subscriptions. Prices are parsed from text without floating-point math.
- **Annual cost is the base unit.** Every billing cycle fits a whole number of times into a year, so annual cost is always an exact number of cents. Monthly cost is derived from it with a single rounding step, so totals do not accumulate rounding errors.
- **Next payment dates are calculated, not stored.** A stored "next payment" would go stale. Instead, each payment is calculated from the original start date, so a subscription that started on the 31st returns to the 31st in months that have one (Jan 31, Feb 28, Mar 31, …).
- **Dates are handled in local time.** `YYYY-MM-DD` strings are parsed manually, because `new Date("2026-01-15")` is interpreted as UTC and can land on the previous day in some time zones.
- **Stored data is validated on load.** Corrupted or hand-edited LocalStorage cannot crash the app: unreadable data is backed up and ignored, and invalid entries are skipped. Data is saved in a versioned format so the model can change later.
- **Imported files are not trusted.** A backup is checked for size, format, version, every field of every entry, and duplicate ids before anything is replaced. Only known fields are copied, so extra data in a hand-edited file is dropped.
- **User text is never inserted as HTML.** Elements are built with `textContent`, so a subscription name cannot inject markup.
- **Routing uses the URL hash** (`#/subscriptions`), which works with any static server and supports the back button.
- **Charts are plain HTML and CSS bars** rather than a charting library, to keep the project dependency-free.

## Known limitations

- Totals assume a single currency (EUR); subscriptions in other currencies would be added together unconverted.
- Weekly subscriptions are counted as 52 payments a year, a small simplification.
- Data lives only in this browser unless exported. Clearing site data, or using another browser or device, starts fresh.
- Import replaces all data and cannot be undone, so export first if you might need the current data.
- With the app open in two tabs, the last tab to save wins.

## Future improvements

- Visible error message when LocalStorage is unavailable
- Styled confirmation dialogs instead of the browser's built-in ones
- Currency selection with currency-aware totals
- Merge option when importing
- Donut chart, or Chart.js for richer charts (for example a 12-month spending forecast); the current bars were chosen to avoid a dependency

## Tech

HTML5, CSS3 (custom properties, grid, flexbox), vanilla JavaScript (ES modules), LocalStorage.