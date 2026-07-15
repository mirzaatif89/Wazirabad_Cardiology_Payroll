# Live Deployment

## Frontend static files

The frontend source folder contains separate `.html` entry files for each module, such as:

- `frontend/employee-list.html`
- `frontend/department-code-list.html`
- `frontend/designation-code-list.html`
- `frontend/bank-branch-code-list.html`
- `frontend/bank-code-list.html`
- `frontend/accounts-code-list.html`
- `frontend/wage-type-code-list.html`

Keep these files in `frontend/`. They are source entry pages for Vite.

Build the frontend:

```powershell
npm run build --prefix frontend
```

This creates a temporary generated `frontend/dist` folder for upload. Upload everything inside `frontend/dist` to your website public folder, then the folder can be deleted locally if you want to keep the workspace clean.

The build output also contains separate HTML entry files for the modules, for example:

- `employee-list.html`
- `department-code-list.html`
- `designation-code-list.html`
- `bank-branch-code-list.html`
- `bank-code-list.html`
- `accounts-code-list.html`
- `wage-type-code-list.html`
- `reset-data.html`
- `password-change.html`

Upload all `.html` files, `assets/`, `config.js`, `.htaccess`, and `logo.png` together.

If backend API is on the same domain under `/api`, keep:

```js
window.PAYROLL_API_BASE_URL = "/api";
```

If backend API is on a separate domain, edit uploaded `config.js`:

```js
window.PAYROLL_API_BASE_URL = "https://api.your-domain.com/api";
```

## Backend

Run the backend as a Node app and set `.env`:

```env
PORT=5050
FRONTEND_URL=https://your-domain.com
DB_HOST=localhost
DB_PORT=3306
DB_NAME=PAyroll_Syatems
DB_USER=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=change_this_secret_for_production
```

Start command:

```powershell
npm start --prefix backend
```
