export interface Command {
  name: string;
  description: string;
  adminOnly: boolean;
  execute: (args: string[]) => string;
}

export function createCommand(
  name: string,
  description: string,
  adminOnly: boolean,
  execute: (args: string[]) => string
): Command {
  return { name, description, adminOnly, execute };
}

export function executeCommand(input: string, commands: Command[], isAdmin: boolean): string | null {
  const [commandName, ...args] = input.split(' ');
  const command = commands.find(cmd => cmd.name === commandName);

  if (!command) {
    return 'Unknown command. Type /help for a list of commands.';
  }

  if (command.adminOnly && !isAdmin) {
    return 'This command is for administrators only.';
  }

  return command.execute(args);
}
