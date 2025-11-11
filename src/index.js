import Phaser from "phaser";
import npcImg from "./kai_mori.png";

// ✅ Conversación persistente para toda la escena
let history = [];

class SceneMain extends Phaser.Scene {
  constructor() {
    super("SceneMain");
  }

  preload() {
    this.load.spritesheet("npc", npcImg, {
      frameWidth: 512,   // ← CAMBIALO al tamaño real de cada cuadro
      frameHeight: 512   // ← CAMBIALO también
    });
  }

  create() {
    // NPC
    this.npc = this.add.sprite(300, 250, "npc").setScale(1.3).setInteractive();

    // Caja de diálogo
    this.dialog = this.add.text(50, 430, "Habla con Kai Mori.", {
      fontSize: "20px",
      color: "#00eaff",
      backgroundColor: "#000000aa",
      padding: { x: 12, y: 8 },
      wordWrap: { width: 700 }
    });

    // Campo de texto DOM
    this.inputField = this.add.dom(300, 500).createFromHTML(`
      <input
        id="npcInput"
        type="text"
        placeholder="Dile algo a Kai..."
        style="
          width: 500px;
          height: 40px;
          font-size: 20px;
          color: #ffffff;
          background: #000000aa;
          border: 1px solid #00eaff;
          padding: 8px;
          outline: none;
          border-radius: 4px;
        "
      />
    `);

    // Botón Hablar
    this.add.text(570, 500, "Hablar", {
      fontSize: "22px",
      backgroundColor: "#00eaff",
      color: "#000000",
      padding: { x: 12, y: 6 }
    })
    .setInteractive()
    .on("pointerdown", () => this.ask());
  }

  // -------------------------------
  // LÓGICA DE DIÁLOGO CON KAI
  // -------------------------------
  async ask() {
    const playerMsg = document.getElementById("npcInput").value;
    if (!playerMsg.trim()) return;

    history.push(`Jugador: ${playerMsg}`);

    const conversationText = history.join("\n") + "\nKai Mori:";

    this.dialog.setText("Kai está analizando tu determinación...");
    this.startThinkingAnimation();

    const res = await fetch("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: conversationText })
    });

    const data = await res.json();

    history.push(`Kai Mori: ${data.text}`);

    this.stopThinkingAnimation();
    this.dialog.setText(data.text);

    const audio = new Audio(data.audio_url);
    this.startMouthAnimation();
    audio.onended = () => this.stopMouthAnimation();
    audio.play();

    document.getElementById("npcInput").value = "";
  }

  // -------------------------------
  // ANIMACIONES
  // -------------------------------
  startThinkingAnimation() {
    if (this.thinkingTween) return;
    this.thinkingTween = this.tweens.add({
      targets: this.npc,
      alpha: 0.6,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  stopThinkingAnimation() {
    if (this.thinkingTween) {
      this.thinkingTween.stop();
      this.thinkingTween = null;
    }
    this.npc.setAlpha(1);
  }

  startMouthAnimation() {
    if (this.mouthTween) return;
    this.mouthTween = this.tweens.add({
      targets: this.npc,
      scaleY: 1.36,
      duration: 120,
      yoyo: true,
      repeat: -1,
      ease: "Quad.easeInOut"
    });
  }

  stopMouthAnimation() {
    if (this.mouthTween) {
      this.mouthTween.stop();
      this.mouthTween = null;
    }
    this.npc.setScale(1.3);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game",
  dom: { createContainer: true },
  scene: [SceneMain]
});
