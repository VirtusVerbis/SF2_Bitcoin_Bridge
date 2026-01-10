
# SF2 Bitcoin Exchange to MAME Bridge

## Context

![alt text](https://github.com/VirtusVerbis/SF2_Bitcoin_Bridge/blob/main/readme_src/Sample_Run.png "Sample Run") 

The objective was to create a Bitcoin price action visualizer but instead of looking at a boring chart, I wanted to see the action carried out on Street Fighter 2 via the MAME Emulator.  

The program takes as input the BTC transaction data (specifically quantities of BTC being bought and sold) on Binance and Coinbase - they both have public APIs that provide such info.   Binance input goes towards Player 1 and Coinbase input towards Player 2.

For each Player, all 6 punch and kick buttons are represented, 9 potential combos (definable), Forward + Backwards movements, Jump + Crouch.

Since the program isn't really playing the game, if P1 and P2 switch positions (one jumps over the other) the inputs for combos no longer work (since the combo pattern corresponds to the player's facing direction) - that is until P1 and P2 regain their original positions.

The program was largely (99%) created by Replit AI (www.replit.com) over a span of ~4 days (6-8 hours of my own effort largely spent on re-iterative design and play testing, AI effort was probably less than 30 mins).  If it wasn't for AI, I would not be able to piece this together so quickly, or even at all.

The program isn't limited to SF2 as any game that fits a 1-vs-1 format would work (ie: Mortal Kombat, King of Fighters, etc.) - though this is not tested but the concept is similar (sending key presses to MAME that are user-defined in the 'Settings' menu of the Web Dashboard).  


Here's an early video of the initial creation:

<a href="https://www.youtube.com/watch?v=NpQ0VG9puxE" target="_blank"><img src="https://github.com/VirtusVerbis/SF2_Bitcoin_Bridge/blob/main/readme_src/YouTube_Thumb1.png" 
alt="Click to watch trailer" width="400" height="240" border="10" /></a>


## Instructions

### Replit hosting (Easiest/Quickest)

[Replit Instructions](https://docs.replit.com/getting-started/quickstarts/import-from-zip)

Untested but should work.


### Local hosting (Involved/Liberating)

The following has to be done (steps and updates/changes) in order to get the server /webppage / DB to have it all running locally on your PC.  Instructions are taken from Replit/Gemini, so if anything is unclear try using AI to help explain.


To run this project on your local computer, you'll need:

Prerequisites:

```
	Node.js (version 18 or higher)  (also known as NPM)

	> https://nodejs.org/en/download

	PostgreSQL database running locally

	> https://www.postgresql.org/download/
```

Steps:

Clone or download the project files (ZIP from Replit) to your computer (you should already have a backup saved).


Install dependencies:

1)  Run the nodejs EXE installer first.

Be sure to 'check' the boxes for adding NPM to PATH and making it global to all users (easier).

1a) npm install   <--- that's the command via terminal/Powershell, it has to be run in your project's root folder where the 'package.json' file is found (it looks for it)

You can unzip your project folder anywhere (ie: C or D drive, anything physical)

1b) You might hit this error:

```
"\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system. For more information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170"
```

To resolve this, you will need to modify the execution policy. The safest approach for this specific scenario is usually to set the policy to RemoteSigned for your current user. 

	Here are the steps to modify the execution policy and resolve the error:

	1. Open PowerShell as Administrator 
	You must run PowerShell with administrative privileges to change the execution policy. 
	Click the Start menu.
	Type "PowerShell".
	Right-click on Windows PowerShell (or simply PowerShell in newer Windows versions).
	Select Run as administrator.
	Click Yes on the User Account Control (UAC) prompt. 

	2. Check the Current Execution Policy (Optional) 
	You can check your current execution policy with the following command:
	powershell
	Get-ExecutionPolicy -List
	This command displays the policies set for different scopes (MachinePolicy, UserPolicy, Process, CurrentUser, LocalMachine) [1]. 

	3. Change the Execution Policy 
	To allow local scripts to run while requiring digitally signed scripts from the internet, run the following command. 
	This setting usually resolves the npm issue without significantly lowering security [1]. 
	
	powershell
	Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

	4. Confirm the Change
	PowerShell will ask you to confirm the change. 
	Type A and press Enter to select "Yes to All". 

	5. Try Running npm Again 
	After changing the execution policy, the error should be resolved. Close the administrative PowerShell window and open a new, 
	regular terminal or Command Prompt window (no admin privileges needed) and try running your npm command again (e.g., npm install or npm -v). 

Once done installing, you should get a notification indicating so in the terminal prompt.


2) Set up PostgreSQL <--- use the .EXE installer.  The default username is 'postgres', pw is the one you setup via the installer.

If you screw up and can't remember the password, you can ask AI on how to bypass/reset it (steps will be provided).  The key difficult blocker was realizing 'postgres' was the user name by default as the installer doesn't ask for this, it just uses it.  Requires editing the postgresql\18\data\pg_hba.conf file. 

2aa) You might hit this error:

```
"psql : The term 'psql' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again."
```

	The error message "psql : The term 'psql' is not recognized..." occurs on Windows because the system does not know where to find the psql executable. 
	You need to add the PostgreSQL installation's bin directory to your system's PATH environment variable. 
	Step-by-Step Guide to Fix the Error
	Locate the PostgreSQL bin directory: The default installation path is usually C:\Program Files\PostgreSQL\<version>\bin (e.g., C:\Program Files\PostgreSQL\16\bin). Note the exact path for your version.
	Open Environment Variables:
	Press the Windows key and type "environment variables" in the search bar.
	Select "Edit the system environment variables" from the search results.
	Edit the PATH variable:
	In the "System Properties" window, click the "Environment Variables..." button at the bottom.
	In the "Environment Variables" window, under the "System variables" section, scroll down and find the Path variable.
	Select Path and click the "Edit..." button.
	Add the PostgreSQL path:
	In the "Edit environment variable" window, click "New".
	Paste the path to your PostgreSQL bin directory (e.g., C:\Program Files\PostgreSQL\16\bin).
	You may also need to add the lib directory (C:\Program Files\PostgreSQL\16\lib) on a separate line.
	Click "OK" on all open windows to save the changes.
	Restart your terminal: The changes to the environment variables will not apply to command prompts or PowerShell windows that were already open.
	Close your current command prompt or PowerShell window completely.
	Open a new command prompt or PowerShell window.
	Verify the fix: In the new terminal window, type the following command to check if psql is now recognized:
	bash
	psql --version
	If it displays the PostgreSQL version, the problem is solved and you can now run psql from any directory. 
	Alternatively, you can access the psql tool directly from the Start menu by searching for "SQL Shell (psql)" under the PostgreSQL program group.

One installed, you can run the SQL Shell (psql) app (search for it in Windows apps).

OR you can access it via Terminal using 'psql' command.



2a) and create a database, 

	For running locally, you choose your own database name. Here's the detailed setup:

	Option A: If you have PostgreSQL installed locally

	Open a terminal and run psql (OR open SQL Shell (psql)) and create a new database with command:

	createdb crypto_mame (or whatever name you want)
	
	You can check if for success with these commands:
	
	Verify: List all databases to ensure yours appears in the list:
		Inside psql:
		\l
	
	You should see your DB listed.
	
	Exit psql (\q)

2b) then set the environment variable Permenantly using:

	export DATABASE_URL="postgresql://username:password@localhost:5432/your_database"


	(TEMP method , killed when terminal is closed) In terminal:
		Set the connection string (replace with your PostgreSQL credentials):

		export DATABASE_URL="postgresql://your_username:your_password@localhost:5432/crypto_mame"
		
		
		Common defaults:

		Username: Often postgres or your system username
		Password: Whatever you set during PostgreSQL installation
		Port: Usually 5432
		Database name: crypto_mame (or any name you choose)
	
	Permenant method:
	
	how to set permenant psql connection string "export DATABASE_URL="postgresql://your_username:your_password@localhost:5432/crypto_mame"" in windows11
	
		To set a permanent DATABASE_URL environment variable in Windows 11, you should use the graphical user interface for System Properties or the setx command in the Command Prompt or PowerShell. 
		Using the Graphical Interface (Recommended)
		This method modifies the system-wide environment variables and is generally the most straightforward approach.
		Open the System Properties:
		Press the Windows key and search for "environment variables".
		Click on Edit the system environment variables. This will open the System Properties window.
		Access Environment Variables:
		In the System Properties window, on the Advanced tab, click the Environment Variables... button.
		Create a New System Variable:
		Under System variables (for all users) or User variables (only for your account), click New....
		Define the Variable:
		In the New System Variable window, enter the following:
		Variable name: DATABASE_URL
		Variable value: postgresql://your_username:your_password@localhost:5432/crypto_mame
		Click OK on all open windows to save the changes. 
			
		Verify the Changes
		The new variable will not be available in any Command Prompt or PowerShell windows that were open before you made the changes.
		Open a new terminal window (Command Prompt or PowerShell) after completing the steps above.
		To verify the variable is set correctly, type one of the following commands:
		In Command Prompt: echo %DATABASE_URL%
		In PowerShell: $env:DATABASE_URL 
		This should output the full connection string you entered. The DATABASE_URL is now permanently set and will persist across system restarts. 
	



3) Run database migrations in terminal/powershell:
```
npm run db:push
```
This command deploys the DB schema to your Locally created DB in psql.


### How to Run it

4) Start the application:
```
npm run dev
```

You might hit this error:
```
getting npm error "Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:5000"
```

	That error happens because 0.0.0.0 binding isn't supported on some local systems (especially Windows/macOS). The app is configured for Replit's environment.

	Quick fix for local development:

	You need to change the server to bind to 127.0.0.1 instead of 0.0.0.0. Look for this in the server startup code (likely in server/index.ts or server/vite.ts) and change:

	// From:
	app.listen(5000, "0.0.0.0", ...)
	// To:
	app.listen(5000, "127.0.0.1", ...)
	Or you can set an environment variable before running (temp):

	export HOST=127.0.0.1
	npm run dev

	Better way:
		Edit project File: server/index.ts
		Line 91

		Change:

		host: "0.0.0.0",
		To:

		host: "127.0.0.1",
		You should also remove reusePort: true on line 92 as that can cause issues on some systems too.
		


You might get this error:
```
"npm run dev > rest-express@1.0.0 dev > NODE_ENV=development tsx server/index.ts 'NODE_ENV' is not recognized as an internal or external command, operable program or batch file."
```

	The syntax NODE_ENV=development ... is used in Unix-based systems (like macOS and Linux), but Windows command prompt (cmd.exe) uses a different command to set environment variables. 
	How to Fix the Error
	You have a few options to resolve this issue:
	1. Use the cross-env package (Recommended) 
	The cross-env package is the most common and robust solution, allowing you to use a consistent, cross-platform syntax in your package.json scripts. 
	Install cross-env as a development dependency:
	bash
	npm install --save-dev cross-env
	Modify your package.json script to use cross-env before your command:
	json
	"scripts": {
	  "dev": "cross-env NODE_ENV=development tsx server/index.ts"
	}
	Now, running npm run dev will work correctly on both Windows and Unix-based systems. 
	
	OR (I used the above method)
	
	2. Use Windows-specific syntax in your script 
	If you are only working on Windows and don't want to install an extra package, you can modify the script to use the Windows set command.
	Modify your package.json script to use set and the & operator:
	json
	"scripts": {
	  "dev": "set NODE_ENV=development& tsx server/index.ts"
	}
	Note: There should be no space between development and the & symbol. 



Open your browser to http://localhost:5000   (copy paste to browser)

You should see the dashboard running normally.


5) Run the bridge.py to catch all the inputs coming from the website above.

Edit the bridge.py for:

Line 454:
```
if __name__ == "__main__":
    import os
    # Update this with your actual dashboard URL if running remotely
    # bridge = CryptoMAMEBridge()
    bridge = CryptoMAMEBridge(dashboard_url="http://localhost:5000/")  #local server   <----- use this for LOCAL
```

### How to configure buttons

6) "Restore Default" values in the dashboard > settings page.  

This is required because the DB internal defaults are just examples choosen by AI.  "Restoring Defaults" will reload all the hardcoded constants that have been tested working and specific to my MAME key config.  You can change the keys to whatever you prefer, as well as adusting the BTC range thresholds to trigger each move.

If you miss this part, it will look like Ryu and Ken are doing stuff, but can't seem to do the special combos, etc. - as if something is broken, what's really broken is the settings being defaulted to incorrect keys.

7) All done.  Enjoy.






## Credits

Credits go to:

Replit.com (AI Coding).

MAME is an open-source arcade emulator (https://www.mamedev.org/).

Capcom owns the rights to SF2 (Street Fighter 2).





## Bitcoin

Bitcoin has existed since January 3rd, 2009 (~17 years now) and still hasn't gone to zero. There's a lot to be said about Bitcoin and there is a plethora of info that can be found on the net (ie: YouTube, Spotify, Twitter/X).

For any folks interested in understanding it better, here are some introductory documentaries/movies (free):

<a href="https://www.youtube.com/watch?v=oksraL7wN6Q" target="_blank"><img src="https://github.com/VirtusVerbis/ProjectSaylor_BitcoinsOfRage/blob/main/readme_src/godblessbtc.png" 
alt="Click to watch trailer" width="400" height="240" border="10" /></a>

<a href="https://www.youtube.com/watch?v=YtFOxNbmD38&t=1s" target="_blank"><img src="https://github.com/VirtusVerbis/ProjectSaylor_BitcoinsOfRage/blob/main/readme_src/wtp.png" 
alt="Click to watch trailer" width="400" height="240" border="10" /></a>


Here are some great books to read:

[The Bitcoin Standard](https://www.amazon.com/dp/1119473861/?bestFormat=true&k=bitcoin%20standard&ref_=nb_sb_ss_w_scx-ent-pd-bk-d_de_k0_1_16&crid=2TLRJFOELT4NS&sprefix=bitcoin%20standard)

[Broken Money](https://www.amazon.com/Broken-Money-Financial-System-Failing/dp/B0CNS7NQLD/ref=sr_1_1?crid=1JVWCUF4LJ79H&dib=eyJ2IjoiMSJ9.QQTmoXfHo3orjH9JlysRUr9vH-0EGH4pZV-Ob7W47te8NyJ-BupmguhjTw8g6OekqWY-91NSVr3asXfSDVO2ogVXAiACXyLmj_W2pK7H2263OCLuhgEEL-Cl8x14-Z6X0MU7wX69a9ZltRCJEFloTp-cZMwPLQ2_RJ_HrcZnkEzh1ti9ONoUpCrVR3e-JOMaSI4r3FWPxn-ZC8b-s7skM_Xffr-XABkqCxAWXCKCV6s.jpS_xm68fhZLeqmcgtVTX9ehhO5g4san1grd8jNOH7g&dib_tag=se&keywords=broken+money&qid=1744857885&s=books&sprefix=broken+money%2Cstripbooks%2C149&sr=1-1)

[Mastering Bitcoin (Technical)](https://www.amazon.com/Mastering-Bitcoin-Programming-Open-Blockchain/dp/1098150090/ref=pd_rhf_se_s_pd_sbs_rvi_d_sccl_2_6/137-9373380-1340239?pd_rd_w=COge7&content-id=amzn1.sym.46e2be74-be72-4d3f-86e1-1de279690c4e&pf_rd_p=46e2be74-be72-4d3f-86e1-1de279690c4e&pf_rd_r=GZCSTE83X6H1PAN8ZA6V&pd_rd_wg=5DaNL&pd_rd_r=cd477d3d-d81a-4b35-a215-cb1803bf0650&pd_rd_i=1098150090&psc=1)


