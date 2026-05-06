# Egg Repack Tally Tracker
        
- When the user opens the webpage they should be asked “start new session” or “resume last session”.  
- The user chooses from 5 egg type options: extra large white, large white, large brown, medium white, and large white flat.  
- Prompt the user with “how many eggs repacked?” and allow entry of a number limited to 1‑12, or 1‑30 for the large white flat option.  
- Add the entered number to a repack tally for that egg type.  
- Subtract the entered number from the carton size (12 or 30) and add that result to a damaged tally for that egg type.  
- Repack counts for large white flats are added to the large white (12) tally; there is no separate tally for large white flat repacks, only a damaged tally.  
- When the user is finished counting they press a “counting complete” button, which shows the final tally for repacked and damaged eggs.  
- Also display the number of repacked and damaged cartons by dividing the total tally by the carton size (12, except flats which are 30). Show the carton count as whole cartons, not a decimal.  
- Provide a way to go back if the user makes a mistake.  
- Include a button for manual adjustment of the running tally.

Made with Floot.

# Instructions

For security reasons, the `env.json` file is not pre-populated — you will need to generate or retrieve the values yourself.  

For **JWT secrets**, generate a value with:  

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the generated value into the appropriate field.  

For the **Floot Database**, download your database content as a pg_dump from the cog icon in the database view (right pane -> data -> floot data base -> cog icon on the left of the name), upload it to your own PostgreSQL database, and then fill in the connection string value.  

**Note:** Floot OAuth will not work in self-hosted environments.  

For other external services, retrieve your API keys and fill in the corresponding values.  

Once everything is configured, you can build and start the service with:  

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
