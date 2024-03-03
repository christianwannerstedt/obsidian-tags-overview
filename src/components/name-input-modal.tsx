import { App, Modal, Setting } from "obsidian";

export class NameInputModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h4", { text: "Enter the name of the filter" });

    new Setting(contentEl).setName("Name:").addText((text) =>
      text.onChange((value) => {
        this.result = value;
      })
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Save")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.result);
        })
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
