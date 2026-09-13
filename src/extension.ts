import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import { startProxy, type ClearanceProxy } from "./proxy/server";
import { applySettingsBlock, stripSettingsBlock, userSettingsPath } from "./vscode/settingsBlock";

let proxy: ClearanceProxy | undefined;
let status: vscode.StatusBarItem | undefined;
let savedBytes = 0;
let settingsFile = "";

function formatStatus(): string {
  const kb = Math.round(savedBytes / 1024);
  return proxy ? `Clearance on · saved ${kb} kB this session` : "Clearance off";
}

function writeSettings(enable: boolean): void {
  const target = settingsFile || userSettingsPath(os.homedir());
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "{\n}\n";
  const next = enable ? applySettingsBlock(current, proxy!.url) : stripSettingsBlock(current);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, next, "utf8");
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  savedBytes = 0;
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 80);
  status.command = "clearance.enable";
  status.text = "Clearance off";
  status.show();
  context.subscriptions.push(status);

  context.subscriptions.push(
    vscode.commands.registerCommand("clearance.enable", async () => {
      if (proxy) {
        vscode.window.showInformationMessage("Clearance is already enabled.");
        return;
      }
      savedBytes = 0;
      proxy = await startProxy({
        host: "127.0.0.1",
        onSavings: (n) => {
          savedBytes += n;
          if (status) {
            status.text = formatStatus();
          }
        },
      });
      try {
        writeSettings(true);
      } catch (err) {
        await proxy.close();
        proxy = undefined;
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Clearance could not update settings: ${message}`);
        return;
      }
      if (status) {
        status.text = formatStatus();
        status.command = "clearance.disable";
      }
      vscode.window.showInformationMessage(`Clearance enabled on ${proxy.url}`);
    }),
    vscode.commands.registerCommand("clearance.disable", async () => {
      if (proxy) {
        await proxy.close();
        proxy = undefined;
      }
      try {
        writeSettings(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Clearance could not restore settings: ${message}`);
      }
      if (status) {
        status.text = "Clearance off";
        status.command = "clearance.enable";
      }
    }),
  );
}

export async function deactivate(): Promise<void> {
  if (proxy) {
    await proxy.close();
    proxy = undefined;
  }
}

export function setSettingsFileForTests(path: string): void {
  settingsFile = path;
}
