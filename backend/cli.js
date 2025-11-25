const inquirer = require("inquirer");
const chalk = require("chalk");
const { Keychain } = require("./password-manager.js");
const fs = require("fs");
const path = require("path");

// Path to the keychain file
const keychainFile = path.resolve(__dirname, "keychain.json");
let keychain = new Keychain();

/**
 * Initialize the keychain by either loading an existing one or creating a new one.
 */
async function initializeKeychain() {
  try {
    if (fs.existsSync(keychainFile)) {
      const { masterPassword } = await inquirer.prompt([
        {
          type: "password",
          name: "masterPassword",
          message: "Enter your master password:",
          mask: "*",
          validate: (input) => input.trim() !== "" || "Master password cannot be empty.",
        },
      ]);

      keychain = await Keychain.loadFromFile(masterPassword, keychainFile);
      console.log(chalk.green("Keychain loaded successfully."));
    } else {
      const { masterPassword, confirmPassword } = await inquirer.prompt([
        {
          type: "password",
          name: "masterPassword",
          message: "Create a master password:",
          mask: "*",
          validate: (input) =>
            input.length >= 6 || "Password must be at least 6 characters long.",
        },
        {
          type: "password",
          name: "confirmPassword",
          message: "Confirm your master password:",
          mask: "*",
          validate: (input, answers) =>
            input === answers.masterPassword || "Passwords do not match.",
        },
      ]);

      keychain = await Keychain.init(masterPassword);
      await keychain.dumpToFile(keychainFile);
      console.log(chalk.green("New keychain created and saved successfully."));
    }
  } catch (error) {
    console.error(chalk.red("Failed to initialize keychain:"), error.message);
    process.exit(1);
  }
}

/**
 * Display the main menu and handle user selections.
 */
async function mainMenu() {
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Select an action:",
        choices: [
          "Add a password",
          "Retrieve a password",
          "Remove a password",
          "List all websites",
          new inquirer.Separator(),
          "Exit",
        ],
      },
    ]);

    switch (action) {
      case "Add a password":
        await addPassword();
        break;
      case "Retrieve a password":
        await retrievePassword();
        break;
      case "Remove a password":
        await removePassword();
        break;
      case "List all websites":
        await listWebsites();
        break;
      case "Exit":
        console.log(chalk.blue("Goodbye!"));
        process.exit(0);
    }
  }
}

/**
 * Add a new password entry.
 */
async function addPassword() {
  const { website, password } = await inquirer.prompt([
    {
      type: "input",
      name: "website",
      message: "Enter the website URL or name:",
      validate: (input) => input.trim() !== "" || "Website cannot be empty.",
    },
    {
      type: "password",
      name: "password",
      message: "Enter the password:",
      mask: "*",
      validate: (input) => input.trim() !== "" || "Password cannot be empty.",
    },
  ]);

  try {
    await keychain.set(website.trim(), password);
    await keychain.dumpToFile(keychainFile);
    console.log(chalk.green(`Password for "${website}" added successfully.`));
  } catch (error) {
    console.error(chalk.red("Failed to add password:"), error.message);
  }
}

/**
 * Retrieve a password for a specific website.
 */
async function retrievePassword() {
  const { website } = await inquirer.prompt([
    {
      type: "input",
      name: "website",
      message: "Enter the website URL or name to retrieve the password:",
      validate: (input) => input.trim() !== "" || "Website cannot be empty.",
    },
  ]);

  try {
    const password = await keychain.get(website.trim());
    if (password) {
      console.log(chalk.green(`Password for "${website}": ${password}`));
    } else {
      console.log(chalk.yellow(`No password found for "${website}".`));
    }
  } catch (error) {
    console.error(chalk.red("Failed to retrieve password:"), error.message);
  }
}

/**
 * Remove a password entry for a specific website.
 */
async function removePassword() {
  const { website } = await inquirer.prompt([
    {
      type: "input",
      name: "website",
      message: "Enter the website URL or name to remove the password:",
      validate: (input) => input.trim() !== "" || "Website cannot be empty.",
    },
  ]);

  try {
    const removed = await keychain.remove(website.trim());
    if (removed) {
      await keychain.dumpToFile(keychainFile);
      console.log(chalk.green(`Password for "${website}" removed successfully.`));
    } else {
      console.log(chalk.yellow(`No password found for "${website}".`));
    }
  } catch (error) {
    console.error(chalk.red("Failed to remove password:"), error.message);
  }
}

/**
 * List all stored websites.
 */
async function listWebsites() {
  try {
    const websites = Object.keys(keychain.kvs);
    if (websites.length === 0) {
      console.log(chalk.yellow("No passwords stored."));
    } else {
      console.log(chalk.blue("Stored Websites:"));
      websites.forEach((site, index) => {
        console.log(`${index + 1}. ${site}`);
      });
    }
  } catch (error) {
    console.error(chalk.red("Failed to list websites:"), error.message);
  }
}

/**
 * Main function to run the CLI application.
 */
async function run() {
  console.log(chalk.cyan.bold("Welcome to the Secure Password Manager CLI"));
  await initializeKeychain();
  await mainMenu();
}

run();
