export const CARD_APPLY_URL = "https://sgcard.sgxmeta.ai/";
export const CARD_APPLY_LABEL = "Apply now";

export const CARD_HERO = {
  eyebrow: "Sagenex Global Pay Card",
  title: ["Secure by heritage.", "Spend worldwide."],
  subtitle:
    "Your hardware wallet and Visa card in one — private keys sealed offline, SG Coins that spend anywhere Visa is accepted.",
  trustTitle: "EAL6+ certified secure element",
  trustSubtitle: "Built with Samsung Semiconductors",
} as const;

export const CARD_FEATURES = [
  {
    id: "eal6",
    title: "EAL6+ Secure Element",
    desc: "Your private keys are generated and sealed inside a bank-grade chip that never touches the internet.",
  },
  {
    id: "tap",
    title: "Tap to sign",
    desc: "Approve any payment by tapping the card to your phone — no seed phrase, no cables, no batteries.",
  },
  {
    id: "durability",
    title: "Built to last",
    desc: "A rugged, sealed build with no moving parts, rated to survive water, heat, and cold for years.",
  },
  {
    id: "spend",
    title: "Spend anywhere",
    desc: "Works as a Visa Global Pay card, so you can spend your crypto anywhere Visa is accepted.",
  },
] as const;

export const CARD_TRUST_CHIPS = [
  "Non-custodial & seedless",
  "14,100+ assets · 90+ networks",
  "Rugged, sealed build",
] as const;

export const BACKUP_HEADER = {
  label: "Get started",
  title: "Your card in three steps.",
  desc: "Create an account, verify your identity, and we'll ship your Sagenex Global Pay Card — your cold wallet and Visa card in one.",
} as const;

export const BACKUP_STEPS = [
  {
    title: "Create your account",
    desc: "Sign up with your email, set a password, and download the Sagenex app.",
    pill: "Sign up",
  },
  {
    title: "Complete KYC",
    desc: "Verify your identity in minutes — upload a government ID and take a quick selfie.",
    pill: "KYC",
  },
  {
    title: "Receive your card",
    desc: "Your Sagenex Global Pay Card ships to your door. Tap it to your phone to activate.",
    pill: "Get card",
  },
] as const;

export const BACKUP_FOOTER =
  "Once activated, your private keys are generated and stored on the card's tamper-resistant secure element — they never leave the chip.";

export const CHIP_FEATURES = [
  {
    title: "Certified Secure Element",
    desc: "The same chip technology trusted by banks and governments, engineered with Samsung Semiconductors for tamper-resistant key storage.",
  },
  {
    title: "EAL6+ certified",
    desc: "Independently tested and certified to the highest commercial security standard for hardware wallets.",
  },
  {
    title: "Attack countermeasures",
    desc: "Built-in protections against side-channel attacks, fault injection, and physical tampering attempts.",
  },
  {
    title: "Open source firmware",
    desc: "Transparent, community-audited code — no hidden backdoors. Verify the firmware yourself on GitHub.",
  },
] as const;

export const CARD_FAQS = [
  {
    q: "What is a Sagenex hardware wallet?",
    a: "Sagenex is a cold wallet in the form of a card. It stores your private keys offline on a certified secure chip, so your crypto never touches the internet until you authorize a transaction with a tap.",
  },
  {
    q: "How is Sagenex different from a software wallet?",
    a: "Software wallets keep keys on your phone or computer, which are always connected to the internet. Sagenex keeps keys on a dedicated hardware chip that never exposes them — even if your phone is compromised.",
  },
  {
    q: "Do I need a seed phrase?",
    a: "No. Your private key is generated and stored on the card's secure chip, so there's no seed phrase to manage. You can still generate a traditional recovery phrase if you prefer, but it's optional.",
  },
  {
    q: "Which cryptocurrencies does Sagenex support?",
    a: "Sagenex supports 14,100+ tokens across 90+ blockchain networks including Bitcoin, Ethereum, Solana, and many more.",
  },
  {
    q: "What happens if I lose my card?",
    a: "As long as you created a recovery phrase during setup, you can restore your wallet on a new card. Your funds always live on the blockchain — the card is simply the secure key to access them.",
  },
] as const;
