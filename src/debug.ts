function startedInDebugMode(): boolean {
  const args: string[] = (process as any).execArgv;
  if (args) {
    return args.some(
      arg =>
        /^--debug=?/.test(arg) ||
        /^--debug-brk=?/.test(arg) ||
        /^--inspect=?/.test(arg) ||
        /^--inspect-brk=?/.test(arg),
    );
  }

  return false;
}

declare var v8debug: any;
export default typeof v8debug === 'object' || startedInDebugMode();
