import { z } from "zod";

export const productCategorySchema = z.enum([
  "computers-accessories",
  "networking-wifi",
  "security-cameras",
  "smart-office",
  "refurbished-devices",
  "cables-peripherals",
]);

const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(4),
  category: productCategorySchema,
  description: z.string().min(30),
  priceAud: z.number().positive(),
  image: z.string().startsWith("/products/"),
  keywords: z.array(z.string()).min(2),
  features: z.array(z.string()).min(3),
  specifications: z.record(z.string(), z.string()).refine((value) => Object.keys(value).length >= 3),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  recommended: z.boolean().default(false),
  placeholder: z.literal(true),
});

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Product = z.infer<typeof productSchema>;

export const productCategories: { slug: ProductCategory; name: string; description: string; image: string }[] = [
  { slug: "computers-accessories", name: "Computers and accessories", description: "Work-ready computing essentials and practical desk upgrades.", image: "/products/computers.svg" },
  { slug: "networking-wifi", name: "Networking and Wi-Fi", description: "Connectivity equipment selected around coverage and reliability.", image: "/products/networking.svg" },
  { slug: "security-cameras", name: "Security and cameras", description: "Devices for visible, considered workplace security foundations.", image: "/products/security.svg" },
  { slug: "smart-office", name: "Smart office equipment", description: "Useful office tools that reduce friction in everyday work.", image: "/products/smart-office.svg" },
  { slug: "refurbished-devices", name: "Refurbished devices", description: "Sample business devices whose condition and warranty details would be confirmed before sale.", image: "/products/refurbished.svg" },
  { slug: "cables-peripherals", name: "Cables, adapters and peripherals", description: "Compatible essentials for desks, displays and device connections.", image: "/products/peripherals.svg" },
];

const draftProducts = [
  { slug: "business-laptop-14", name: "14-inch Business Laptop", category: "computers-accessories", description: "A portable business laptop concept for office productivity, meetings and secure everyday work.", priceAud: 1499, image: "/products/computers.svg", keywords: ["laptop", "computer", "office", "portable"], features: ["14-inch display", "Business-class processor", "USB-C charging and display support"], specifications: { Processor: "Current-generation business processor", Memory: "16 GB", Storage: "512 GB SSD", Display: "14-inch" }, featured: true, isNew: true, recommended: true, placeholder: true },
  { slug: "usb-c-docking-station", name: "USB-C Docking Station", category: "computers-accessories", description: "A single-cable desk connection concept for displays, network access and everyday peripherals.", priceAud: 249, image: "/products/computers.svg", keywords: ["dock", "usb-c", "display", "laptop"], features: ["Dual-display support", "Gigabit network port", "Power delivery"], specifications: { Connection: "USB-C", Displays: "Up to two", Network: "Gigabit Ethernet" }, featured: false, isNew: false, recommended: true, placeholder: true },
  { slug: "business-wifi-access-point", name: "Business Wi-Fi Access Point", category: "networking-wifi", description: "A ceiling-mount access point concept for improving managed wireless coverage in a small workplace.", priceAud: 329, image: "/products/networking.svg", keywords: ["wifi", "wireless", "network", "access point", "office"], features: ["Business Wi-Fi standard", "Multiple network support", "Central management capability"], specifications: { Mounting: "Ceiling or wall", Power: "Power over Ethernet", Networks: "Multiple SSIDs" }, featured: true, isNew: true, recommended: true, placeholder: true },
  { slug: "managed-gigabit-switch", name: "8-Port Managed Network Switch", category: "networking-wifi", description: "A compact managed switch concept for connected desks, access points and segmented small-office networks.", priceAud: 189, image: "/products/networking.svg", keywords: ["switch", "ethernet", "network", "managed", "poe"], features: ["Eight Gigabit ports", "VLAN support", "Power over Ethernet model option"], specifications: { Ports: "8 × Gigabit Ethernet", Management: "Web managed", Mounting: "Desktop or wall" }, featured: false, isNew: false, recommended: true, placeholder: true },
  { slug: "indoor-security-camera", name: "Indoor Security Camera", category: "security-cameras", description: "A business camera concept for monitored indoor areas, subject to privacy and installation assessment.", priceAud: 219, image: "/products/security.svg", keywords: ["camera", "security", "indoor", "monitoring"], features: ["High-definition image", "Night visibility", "Local or managed recording options"], specifications: { Placement: "Indoor", Connection: "Wired network", Recording: "Requires compatible recorder" }, featured: true, isNew: false, recommended: false, placeholder: true },
  { slug: "smart-video-doorbell", name: "Smart Video Doorbell", category: "security-cameras", description: "A connected entry camera concept for small offices where installation and privacy requirements are confirmed first.", priceAud: 279, image: "/products/security.svg", keywords: ["doorbell", "camera", "entry", "security"], features: ["Two-way audio", "Motion notification", "Weather-resistant housing"], specifications: { Placement: "Covered outdoor entry", Connection: "Wi-Fi", Power: "Wired or compatible supply" }, featured: false, isNew: true, recommended: false, placeholder: true },
  { slug: "conference-speaker", name: "USB Conference Speaker", category: "smart-office", description: "A compact microphone and speaker concept for clearer small-room and hybrid team conversations.", priceAud: 199, image: "/products/smart-office.svg", keywords: ["conference", "speaker", "microphone", "meeting", "usb"], features: ["USB plug-and-play", "Echo reduction", "Physical mute control"], specifications: { Connection: "USB-C", Room: "Small meeting room", Controls: "Mute and volume" }, featured: false, isNew: true, recommended: true, placeholder: true },
  { slug: "document-scanner", name: "Duplex Document Scanner", category: "smart-office", description: "A desktop scanning concept for turning everyday paper workflows into searchable digital records.", priceAud: 449, image: "/products/smart-office.svg", keywords: ["scanner", "document", "duplex", "paper", "office"], features: ["Two-sided scanning", "Automatic document feeder", "Searchable PDF workflow support"], specifications: { Feed: "Automatic document feeder", Scanning: "Duplex", Connection: "USB and network options" }, featured: true, isNew: false, recommended: false, placeholder: true },
  { slug: "refurbished-business-desktop", name: "Refurbished Business Desktop", category: "refurbished-devices", description: "A sample refurbished desktop configuration for dependable office tasks, with final grading still to be approved.", priceAud: 699, image: "/products/refurbished.svg", keywords: ["refurbished", "desktop", "computer", "office"], features: ["Business-class chassis", "Solid-state storage", "Condition report required before sale"], specifications: { Memory: "16 GB", Storage: "512 GB SSD", Condition: "Placeholder grade — to be confirmed" }, featured: false, isNew: false, recommended: true, placeholder: true },
  { slug: "refurbished-business-laptop", name: "Refurbished Business Laptop", category: "refurbished-devices", description: "A sample refurbished laptop configuration for mobile work, pending battery, condition and warranty checks.", priceAud: 799, image: "/products/refurbished.svg", keywords: ["refurbished", "laptop", "portable", "computer"], features: ["Business laptop platform", "Solid-state storage", "Battery report required before sale"], specifications: { Memory: "16 GB", Storage: "512 GB SSD", Condition: "Placeholder grade — to be confirmed" }, featured: false, isNew: false, recommended: false, placeholder: true },
  { slug: "usb-c-display-adapter", name: "USB-C Display Adapter", category: "cables-peripherals", description: "A compact display adapter concept for connecting a compatible USB-C laptop to HDMI displays.", priceAud: 59, image: "/products/peripherals.svg", keywords: ["adapter", "usb-c", "hdmi", "display", "cable"], features: ["USB-C input", "HDMI output", "Compact travel format"], specifications: { Input: "USB-C with display support", Output: "HDMI", Resolution: "Dependent on host device" }, featured: false, isNew: true, recommended: false, placeholder: true },
  { slug: "ergonomic-wireless-keyboard-mouse", name: "Wireless Keyboard and Mouse Set", category: "cables-peripherals", description: "A practical wireless desktop set concept designed for comfortable everyday office input.", priceAud: 119, image: "/products/peripherals.svg", keywords: ["keyboard", "mouse", "wireless", "peripheral", "office"], features: ["Full-size keyboard", "Adjustable mouse sensitivity", "Shared wireless receiver"], specifications: { Layout: "Australian English", Connection: "Wireless receiver", Power: "Replaceable batteries" }, featured: false, isNew: false, recommended: true, placeholder: true },
] satisfies Product[];

export const products = z.array(productSchema).parse(draftProducts);
export const productBySlug = new Map(products.map((product) => [product.slug, product]));
export const categoryBySlug = new Map(productCategories.map((category) => [category.slug, category]));

export function searchProducts(query = "", category = "all") {
  const normalizedQuery = query.trim().toLocaleLowerCase("en-AU");
  return products.filter((product) => {
    if (category !== "all" && product.category !== category) return false;
    if (!normalizedQuery) return true;
    const haystack = [product.name, product.description, product.category, ...product.keywords, ...product.features, ...Object.values(product.specifications)].join(" ").toLocaleLowerCase("en-AU");
    return normalizedQuery.split(/\s+/).every((term) => haystack.includes(term));
  });
}
