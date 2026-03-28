import type {
  ResearchResult,
  VendorResult,
  Model3DResult,
  BlueprintResult,
  ImageResult,
  VideoResult,
} from "@/types/pipeline";

// Category-aware mock research that adapts to user input
export function getMockResearch(prompt: string, category?: string, hasImage?: boolean): ResearchResult {
  const lowerPrompt = prompt.toLowerCase();

  // Detect if it's clothing/sewing related
  if (category === "Clothing" || lowerPrompt.includes("blouse") || lowerPrompt.includes("dress") || lowerPrompt.includes("shirt") || lowerPrompt.includes("sew") || lowerPrompt.includes("garment") || lowerPrompt.includes("fabric") || (hasImage && category === "Clothing")) {
    return getMockClothingResearch(prompt, hasImage);
  }

  // Detect electronics
  if (category === "Electronics" || lowerPrompt.includes("circuit") || lowerPrompt.includes("led") || lowerPrompt.includes("arduino") || lowerPrompt.includes("electronic")) {
    return getMockElectronicsResearch(prompt);
  }

  // Default: furniture/woodworking
  return getMockFurnitureResearch(prompt);
}

function getMockClothingResearch(prompt: string, hasImage?: boolean): ResearchResult {
  const title = hasImage
    ? "Recreate This Garment: Custom Blouse from Image Analysis"
    : `Build Guide: ${prompt.slice(0, 60)}`;

  return {
    title,
    overview: hasImage
      ? "Based on the uploaded image, this guide walks you through recreating this garment from scratch. The analysis identified key construction details, fabric types, and design elements. Follow these steps to sew your own version of this piece."
      : "This comprehensive guide walks you through sewing a custom blouse from scratch, including pattern drafting, fabric selection, cutting, and construction techniques.",
    materials: [
      { name: "Main fabric", quantity: "2.5 yards", specification: "Cotton poplin or silk crepe, 45\" wide" },
      { name: "Interfacing", quantity: "0.5 yard", specification: "Lightweight fusible interfacing for collar/cuffs" },
      { name: "Thread", quantity: "1 spool", specification: "Matching polyester all-purpose thread" },
      { name: "Buttons", quantity: "7 pieces", specification: '3/8" or 1/2" buttons, matching or contrast' },
      { name: "Bias tape", quantity: "2 yards", specification: '1/2" single-fold, matching fabric color' },
      { name: "Pattern paper", quantity: "3 sheets", specification: "Large sheets for drafting pattern pieces" },
      { name: "Seam binding", quantity: "1 yard", specification: "For finishing raw edges" },
      { name: "Pins & clips", quantity: "1 box", specification: "Sewing pins and fabric clips" },
    ],
    tools: [
      "Sewing machine",
      "Iron and ironing board",
      "Fabric scissors",
      "Measuring tape",
      "Seam ripper",
      "Marking chalk or fabric pen",
      "Hand sewing needles",
      "Dress form (optional)",
    ],
    steps: [
      { stepNumber: 1, title: "Take measurements", description: "Measure bust, waist, hip, shoulder width, arm length, and desired blouse length. Add 1-2 inches of ease to bust and waist measurements for comfort." },
      { stepNumber: 2, title: "Draft or trace the pattern", description: "Using your measurements, draft the front bodice, back bodice, sleeve, and collar pattern pieces on pattern paper. Add 5/8\" seam allowance to all edges and 1\" for hems." },
      { stepNumber: 3, title: "Cut the fabric", description: "Pin pattern pieces to fabric, aligning grainline arrows with the selvage. Cut 2 front pieces, 1 back piece (on fold), 2 sleeves, and collar pieces. Transfer all markings with chalk." },
      { stepNumber: 4, title: "Apply interfacing", description: "Fuse lightweight interfacing to the wrong side of collar pieces and button placket area using a warm iron and press cloth. Allow to cool flat." },
      { stepNumber: 5, title: "Sew darts and seams", description: "Sew any bust darts on the front pieces. Then join front and back at shoulder seams with 5/8\" seam allowance. Press seams open with iron." },
      { stepNumber: 6, title: "Attach the collar", description: "Sew collar pieces right sides together, turn and press. Pin collar to neckline, matching center backs and notches. Stitch in place and finish with bias tape." },
      { stepNumber: 7, title: "Set in sleeves", description: "Ease the sleeve cap by running a basting stitch between notches. Pin sleeve to armhole, matching notches and shoulder point. Sew with garment side up." },
      { stepNumber: 8, title: "Close side seams", description: "With right sides together, sew continuous side seam from sleeve hem to blouse hem in one pass. Finish seams with zigzag or serger." },
      { stepNumber: 9, title: "Create buttonhole placket", description: "Fold and press the front placket. Mark buttonhole positions evenly spaced. Sew buttonholes using machine's buttonhole function, then cut open carefully." },
      { stepNumber: 10, title: "Hem and finish", description: "Turn up sleeve hems 1/2\" twice and topstitch. Turn up blouse hem 1\" and blind stitch or topstitch. Sew on buttons to correspond with buttonholes. Give final press." },
    ],
    safetyNotes: [
      "Keep fingers away from the sewing machine needle at all times.",
      "Use a thimble when hand-sewing through thick layers.",
      "Be careful with hot iron — always use a press cloth on delicate fabrics.",
      "Store pins and needles in a pincushion, never leave loose on surfaces.",
    ],
    estimatedTime: "6-10 hours",
    difficulty: "Intermediate",
    rawGuide: `Full sewing guide for a custom blouse. ${hasImage ? "Based on uploaded image analysis." : "Based on user specifications."}`,
  };
}

function getMockElectronicsResearch(prompt: string): ResearchResult {
  return {
    title: `Build Guide: ${prompt.slice(0, 60)}`,
    overview: "This guide walks you through building a custom electronics project. Includes circuit design, component sourcing, assembly, and testing procedures.",
    materials: [
      { name: "Arduino Nano", quantity: "1 piece", specification: "ATmega328P, USB Mini-B" },
      { name: "Breadboard", quantity: "1 piece", specification: "830 tie-point solderless" },
      { name: "LED strips", quantity: "1 meter", specification: "WS2812B addressable RGB, 60 LED/m" },
      { name: "Resistors", quantity: "10 pieces", specification: "330 ohm, 1/4W carbon film" },
      { name: "Capacitor", quantity: "1 piece", specification: "1000µF 16V electrolytic" },
      { name: "Jumper wires", quantity: "1 pack", specification: "Male-to-male assorted lengths" },
      { name: "USB cable", quantity: "1 piece", specification: "USB Mini-B for programming" },
      { name: "Power supply", quantity: "1 piece", specification: "5V 2A DC adapter with barrel jack" },
    ],
    tools: [
      "Soldering iron (30W)",
      "Wire strippers",
      "Multimeter",
      "Computer with Arduino IDE",
      "Needle-nose pliers",
      "Heat shrink tubing",
    ],
    steps: [
      { stepNumber: 1, title: "Plan the circuit", description: "Review the circuit diagram and identify all component connections. Place the Arduino Nano on the breadboard spanning the center channel." },
      { stepNumber: 2, title: "Wire power connections", description: "Connect 5V and GND from Arduino to the breadboard power rails. Add the 1000µF capacitor across the power rails for voltage smoothing." },
      { stepNumber: 3, title: "Connect components", description: "Wire the LED strip data line to pin D6 through a 330 ohm resistor. Connect power and ground to the strip. Add any additional sensors or inputs." },
      { stepNumber: 4, title: "Upload the code", description: "Connect the Arduino to your computer via USB. Open Arduino IDE, install the FastLED library, and upload the control sketch." },
      { stepNumber: 5, title: "Test the circuit", description: "Power on and verify all LEDs respond correctly. Use the serial monitor to debug any issues. Check voltage levels with multimeter." },
      { stepNumber: 6, title: "Solder permanent connections", description: "Once tested on breadboard, solder components to a protoboard for permanent mounting. Use heat shrink on all exposed connections." },
    ],
    safetyNotes: [
      "Always disconnect power before making wiring changes.",
      "Use proper ventilation when soldering — avoid breathing fumes.",
      "Be careful of hot soldering iron tip — use a stand.",
      "Double-check polarity before connecting power supply.",
    ],
    estimatedTime: "2-4 hours",
    difficulty: "Beginner",
    rawGuide: "Full electronics build guide for a custom Arduino project.",
  };
}

function getMockFurnitureResearch(prompt: string): ResearchResult {
  return {
    title: `Build Guide: ${prompt.slice(0, 60)}`,
    overview:
      "This comprehensive guide walks you through building a custom wooden bedside table with a single drawer. The design features clean lines, solid wood construction, and a classic look that complements any bedroom.",
    materials: [
      { name: "Pine boards", quantity: "4 pieces", specification: '1x12x48" for sides and top' },
      { name: "Plywood sheet", quantity: "1 piece", specification: '1/4" x 24x24" for drawer bottom' },
      { name: "Drawer slides", quantity: "1 pair", specification: '14" ball-bearing side-mount' },
      { name: "Wood screws", quantity: "24 pcs", specification: '#8 x 1-1/4" flathead' },
      { name: "Wood glue", quantity: "1 bottle", specification: "Titebond III waterproof" },
      { name: "Sandpaper", quantity: "1 pack", specification: "120, 180, 220 grit assorted" },
      { name: "Wood finish", quantity: "1 can", specification: "Danish oil or polyurethane" },
      { name: "Drawer knob", quantity: "1 piece", specification: '1.25" brushed nickel' },
    ],
    tools: [
      "Table saw or circular saw",
      "Drill/driver",
      "Clamps (at least 4)",
      "Measuring tape",
      "Square",
      "Orbital sander",
      "Chisel set",
    ],
    steps: [
      { stepNumber: 1, title: "Cut all pieces to size", description: "Using the table saw, cut the pine boards to the dimensions specified: two sides at 24\" tall, top at 16x16\", bottom shelf at 14x14\", and drawer components." },
      { stepNumber: 2, title: "Sand all pieces", description: "Sand all cut pieces starting with 120 grit, then 180 grit, and finish with 220 grit for a smooth surface." },
      { stepNumber: 3, title: "Assemble the carcass", description: "Attach the two side panels to the bottom shelf using wood glue and screws. Ensure everything is square using a combination square." },
      { stepNumber: 4, title: "Attach the top", description: "Glue and screw the top panel to the side panels. Use clamps to hold everything while the glue dries." },
      { stepNumber: 5, title: "Build the drawer box", description: "Assemble the drawer front, back, two sides, and plywood bottom. Use wood glue and small screws at the joints." },
      { stepNumber: 6, title: "Install drawer slides", description: "Mount the ball-bearing drawer slides on the inside of the carcass and the outside of the drawer box, following the manufacturer's instructions." },
      { stepNumber: 7, title: "Apply finish", description: "Apply 2-3 coats of Danish oil or polyurethane, sanding lightly between coats with 220 grit sandpaper." },
      { stepNumber: 8, title: "Attach hardware", description: "Install the drawer knob centered on the drawer front. Allow all finishes to cure for 24 hours before use." },
    ],
    safetyNotes: [
      "Always wear safety glasses when cutting or sanding.",
      "Use hearing protection when operating power tools.",
      "Ensure proper ventilation when applying wood finish.",
      "Keep fingers away from saw blades — use a push stick.",
    ],
    estimatedTime: "4-6 hours",
    difficulty: "Intermediate",
    rawGuide: "Full build guide for a wooden bedside table with drawer.",
  };
}

export function getMockVendors(category?: string): VendorResult {
  if (category === "Clothing") {
    return {
      vendors: [
        {
          material: "Cotton poplin fabric",
          suppliers: [
            { name: "JOANN Fabrics", url: "https://www.joann.com", priceRange: "$8-15 per yard" },
            { name: "Fabric.com", url: "https://www.fabric.com", priceRange: "$6-12 per yard" },
            { name: "Mood Fabrics", url: "https://www.moodfabrics.com", priceRange: "$10-25 per yard" },
          ],
        },
        {
          material: "Sewing notions (thread, buttons, interfacing)",
          suppliers: [
            { name: "JOANN Fabrics", url: "https://www.joann.com", priceRange: "$2-8 per item" },
            { name: "Amazon", url: "https://www.amazon.com", priceRange: "$3-10 per item" },
            { name: "Wawak", url: "https://www.wawak.com", priceRange: "$1-6 per item" },
          ],
        },
        {
          material: "Pattern paper & marking tools",
          suppliers: [
            { name: "Amazon", url: "https://www.amazon.com", priceRange: "$8-15 per roll" },
            { name: "JOANN Fabrics", url: "https://www.joann.com", priceRange: "$5-12 per pack" },
          ],
        },
      ],
    };
  }

  return {
    vendors: [
      {
        material: "Pine boards (1x12)",
        suppliers: [
          { name: "Home Depot", url: "https://www.homedepot.com", priceRange: "$8-15 per board" },
          { name: "Lowe's", url: "https://www.lowes.com", priceRange: "$9-16 per board" },
          { name: "Woodcraft", url: "https://www.woodcraft.com", priceRange: "$12-20 per board" },
        ],
      },
      {
        material: 'Drawer slides (14" ball-bearing)',
        suppliers: [
          { name: "Amazon", url: "https://www.amazon.com", priceRange: "$8-15 per pair" },
          { name: "Rockler", url: "https://www.rockler.com", priceRange: "$12-25 per pair" },
          { name: "Woodworker's Hardware", url: "https://www.wwhardware.com", priceRange: "$10-18 per pair" },
        ],
      },
      {
        material: "Wood finish (Danish oil)",
        suppliers: [
          { name: "Amazon", url: "https://www.amazon.com", priceRange: "$10-18 per can" },
          { name: "Home Depot", url: "https://www.homedepot.com", priceRange: "$12-20 per can" },
          { name: "Woodcraft", url: "https://www.woodcraft.com", priceRange: "$14-22 per can" },
        ],
      },
    ],
  };
}

export function getMockModel3D(buildId: string): Model3DResult {
  return {
    filePath: `/outputs/${buildId}/model.step`,
    fileName: "model.step",
    format: "STEP",
  };
}

export function getMockBlueprint(buildId: string): BlueprintResult {
  return {
    filePath: `/outputs/${buildId}/blueprint.svg`,
    fileName: "blueprint.svg",
    format: "svg",
  };
}

export function getMockImage(buildId: string): ImageResult {
  return {
    filePath: `/outputs/${buildId}/product.png`,
    fileName: "product.png",
  };
}

export function getMockVideo(buildId: string): VideoResult {
  return {
    clips: [
      { filePath: `/outputs/${buildId}/video_1.mp4`, fileName: "video_1.mp4", description: "Overview of the finished product" },
      { filePath: `/outputs/${buildId}/video_2.mp4`, fileName: "video_2.mp4", description: "Key build step: main assembly" },
      { filePath: `/outputs/${buildId}/video_3.mp4`, fileName: "video_3.mp4", description: "Final reveal with styling" },
    ],
    music: {
      filePath: `/outputs/${buildId}/music.mp3`,
      fileName: "music.mp3",
      duration: "30 seconds",
    },
  };
}

export function getMockMusic(buildId: string): { filePath: string; fileName: string; duration: string } {
  return {
    filePath: `/outputs/${buildId}/music.mp3`,
    fileName: "music.mp3",
    duration: "30 seconds",
  };
}

export function generateMockBlueprintSVG(title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#f8f9fa" stroke="#333" stroke-width="2"/>
  <!-- Title block -->
  <rect x="550" y="480" width="240" height="110" fill="white" stroke="#333" stroke-width="1.5"/>
  <text x="670" y="510" text-anchor="middle" font-family="monospace" font-size="10" fill="#333">FORGELAB BLUEPRINT</text>
  <line x1="550" y1="520" x2="790" y2="520" stroke="#333" stroke-width="1"/>
  <text x="670" y="540" text-anchor="middle" font-family="monospace" font-size="9" fill="#666">${title}</text>
  <text x="670" y="560" text-anchor="middle" font-family="monospace" font-size="8" fill="#999">Scale: 1:10 | Units: mm</text>
  <text x="670" y="580" text-anchor="middle" font-family="monospace" font-size="8" fill="#999">Sheet 1 of 1</text>
  <!-- Border -->
  <rect x="10" y="10" width="780" height="580" fill="none" stroke="#333" stroke-width="1"/>
  <!-- Front view -->
  <text x="200" y="40" text-anchor="middle" font-family="monospace" font-size="12" fill="#333">FRONT VIEW</text>
  <rect x="100" y="60" width="200" height="300" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
  <rect x="120" y="180" width="160" height="80" fill="none" stroke="#1a1a18" stroke-width="1"/>
  <circle cx="200" cy="220" r="5" fill="none" stroke="#1a1a18" stroke-width="1"/>
  <!-- Dimension lines -->
  <line x1="80" y1="60" x2="80" y2="360" stroke="#E8593C" stroke-width="0.5" stroke-dasharray="4"/>
  <text x="70" y="210" text-anchor="middle" font-family="monospace" font-size="9" fill="#E8593C" transform="rotate(-90,70,210)">600mm</text>
  <line x1="100" y1="380" x2="300" y2="380" stroke="#E8593C" stroke-width="0.5" stroke-dasharray="4"/>
  <text x="200" y="395" text-anchor="middle" font-family="monospace" font-size="9" fill="#E8593C">400mm</text>
  <!-- Side view -->
  <text x="480" y="40" text-anchor="middle" font-family="monospace" font-size="12" fill="#333">SIDE VIEW</text>
  <rect x="400" y="60" width="160" height="300" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
  <rect x="410" y="180" width="140" height="80" fill="none" stroke="#1a1a18" stroke-width="1" stroke-dasharray="6"/>
  <!-- Dimension -->
  <line x1="400" y1="380" x2="560" y2="380" stroke="#E8593C" stroke-width="0.5" stroke-dasharray="4"/>
  <text x="480" y="395" text-anchor="middle" font-family="monospace" font-size="9" fill="#E8593C">350mm</text>
  <!-- Top view -->
  <text x="200" y="420" text-anchor="middle" font-family="monospace" font-size="12" fill="#333">TOP VIEW</text>
  <rect x="100" y="435" width="200" height="120" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
  <!-- Grid lines -->
  <line x1="10" y1="410" x2="540" y2="410" stroke="#ddd" stroke-width="0.5"/>
</svg>`;
}

export function generateMockProductImageSVG(title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <rect width="600" height="600" fill="#fafafa"/>
  <!-- Simple 3D-ish table representation -->
  <g transform="translate(300,300)">
    <!-- Table top -->
    <polygon points="-120,-80 120,-80 140,-60 -100,-60" fill="#c4956a" stroke="#8b6914" stroke-width="2"/>
    <rect x="-120" y="-80" width="240" height="12" fill="#d4a574" stroke="#8b6914" stroke-width="1.5" rx="2"/>
    <!-- Legs -->
    <rect x="-110" y="-68" width="12" height="180" fill="#b8845a" stroke="#8b6914" stroke-width="1"/>
    <rect x="98" y="-68" width="12" height="180" fill="#b8845a" stroke="#8b6914" stroke-width="1"/>
    <!-- Drawer -->
    <rect x="-90" y="-30" width="180" height="60" fill="#d4a574" stroke="#8b6914" stroke-width="1.5" rx="2"/>
    <circle cx="0" cy="0" r="6" fill="#888" stroke="#666" stroke-width="1"/>
    <!-- Shadow -->
    <ellipse cx="0" cy="130" rx="140" ry="15" fill="rgba(0,0,0,0.08)"/>
  </g>
  <text x="300" y="530" text-anchor="middle" font-family="Inter,sans-serif" font-size="16" fill="#999">${title}</text>
  <text x="300" y="555" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" fill="#ccc">Generated by ForgeLab [MOCK]</text>
</svg>`;
}
