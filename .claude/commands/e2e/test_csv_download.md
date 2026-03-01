# E2E Test: CSV Table Download

Test that users can download a table as a CSV file using the download button in the Available Tables section.

## User Story

As a data analyst
I want to download any available table as a CSV file
So that I can use the data in external tools without re-uploading it elsewhere

## Test Steps

1. Navigate to the `Application URL`
2. Click the "Upload Data" button (`#upload-data-button`) to open the upload modal
3. **Verify** the upload modal (`#upload-modal`) is visible
4. Click the sample data button with `data-sample="products"` to load the Products sample data
5. Wait for the modal to close and the schema to refresh
6. Take a screenshot of the Available Tables section showing the `products` table
7. **Verify** a `.table-item` element exists in `#tables-list` containing "products" in `.table-name`
8. **Verify** a `.download-table-button` element is visible inside the `products` table card
9. Use Playwright `page.route` or `page.waitForResponse` to intercept the network request to `/api/table/products/download`
10. Click the `.download-table-button` inside the `products` table card
11. **Verify** that a network request was made to `/api/table/products/download`
12. **Verify** the response status is 200
13. **Verify** the response `Content-Type` header contains `text/csv`
14. **Verify** the response body contains a comma-separated header line (e.g., contains a comma)
15. Take a screenshot showing the download was triggered successfully

## Success Criteria
- Download button (`.download-table-button`) is visible inside each table card in the Available Tables section
- Clicking the download button triggers a GET request to `/api/table/{name}/download`
- The response status is 200
- The response `Content-Type` is `text/csv`
- The response body is valid CSV with a header row
- 2 screenshots are taken
