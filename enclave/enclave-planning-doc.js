const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, 
        AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat, PageBreak } = require('docx');

const doc = new Document({
  styles: {
    default: { 
      document: { run: { font: "Arial", size: 24 } } 
    },
    paragraphStyles: [
      { 
        id: "Title", 
        name: "Title", 
        basedOn: "Normal",
        run: { size: 56, bold: true, color: "1E88E5", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER } 
      },
      { 
        id: "Heading1", 
        name: "Heading 1", 
        basedOn: "Normal", 
        quickFormat: true,
        run: { size: 36, bold: true, color: "0D47A1", font: "Arial" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } 
      },
      { 
        id: "Heading2", 
        name: "Heading 2", 
        basedOn: "Normal", 
        quickFormat: true,
        run: { size: 30, bold: true, color: "1976D2", font: "Arial" },
        paragraph: { spacing: { before: 280, after: 180 }, outlineLevel: 1 } 
      },
      { 
        id: "Heading3", 
        name: "Heading 3", 
        basedOn: "Normal", 
        quickFormat: true,
        run: { size: 26, bold: true, color: "42A5F5", font: "Arial" },
        paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 2 } 
      }
    ]
  },
  numbering: {
    config: [
      { 
        reference: "bullet-list",
        levels: [
          { 
            level: 0, 
            format: LevelFormat.BULLET, 
            text: "•", 
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
          }
        ] 
      },
      { 
        reference: "phase-list",
        levels: [
          { 
            level: 0, 
            format: LevelFormat.DECIMAL, 
            text: "%1.", 
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
          }
        ] 
      }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: [
      // Title
      new Paragraph({ 
        heading: HeadingLevel.TITLE, 
        children: [new TextRun("AetherWave Studio User Enclave")] 
      }),
      new Paragraph({ 
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: "Technical Planning Document", size: 32 })] 
      }),
      new Paragraph({ 
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 480 },
        children: [new TextRun({ text: "Frontend Development Specification", italics: true, size: 22, color: "666666" })] 
      }),

      // Executive Summary
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Executive Summary")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("The AetherWave Studio User Enclave is a comprehensive, adaptive dashboard that serves as the central hub for user engagement across the entire platform. Built with React 18+ and TypeScript, this cyberpunk-themed interface provides a unified experience for messaging, content creation, media management, and marketplace interactions.")] 
      }),
      new Paragraph({ 
        spacing: { after: 360 },
        children: [new TextRun("Key features include an adaptive viewport system with multiple viewing modes, dynamic panel management, real-time notifications, and seamless integration with all AetherWave Studio services.")] 
      }),

      // Project Overview
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Project Overview")] 
      }),
      
      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Vision")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("Create an immersive, cyberpunk-themed command center where users can seamlessly navigate all aspects of the AetherWave Studio platform. The interface adapts to user needs through intelligent layout transformations, providing focused experiences for specific tasks while maintaining awareness of the broader ecosystem.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Core Capabilities")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Multi-mode adaptive viewport", bold: true }), new TextRun(" - Dashboard, Theater, Focus, and Split views")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Real-time messaging", bold: true }), new TextRun(" - Direct communication with other users")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Newsfeed integration", bold: true }), new TextRun(" - Post updates and engage with community")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Alert system", bold: true }), new TextRun(" - Priority-based notifications with zoom capabilities")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Media management", bold: true }), new TextRun(" - Upload, organize, and share content")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Virtual band pages", bold: true }), new TextRun(" - Expand and customize band profiles")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Marketplace access", bold: true }), new TextRun(" - List items for sale and browse offerings")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 360 },
        children: [new TextRun({ text: "Global bands gallery", bold: true }), new TextRun(" - Discover and connect with bands worldwide")] 
      }),

      // Page break
      new Paragraph({ children: [new PageBreak()] }),

      // Technical Architecture
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Technical Architecture")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Layout System Architecture")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("The enclave uses an adaptive grid system powered by CSS Grid and Framer Motion for smooth transitions between layout states. This approach provides flexibility while maintaining performance.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_3, 
        children: [new TextRun("View Modes")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Dashboard Mode", bold: true }), new TextRun(" - Multi-panel view displaying all widgets simultaneously")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Theater Mode", bold: true }), new TextRun(" - Main viewport expands, sidebars collapse for focused viewing")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Focus Mode", bold: true }), new TextRun(" - Single widget zooms to center for detailed interaction")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun({ text: "Split Mode", bold: true }), new TextRun(" - Side-by-side layout for multitasking workflows")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_3, 
        children: [new TextRun("Panel Size States")] 
      }),
      new Paragraph({ 
        spacing: { after: 120 },
        children: [new TextRun("Each panel supports four size states: Collapsed, Compact, Normal, and Expanded. Transitions between states are animated using Framer Motion with smooth easing curves.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Component Structure")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("The component hierarchy follows a modular, composable architecture. Each major section is independently maintainable while sharing common state through context providers.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_3, 
        children: [new TextRun("Core Components")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "EnclaveShell.tsx", bold: true }), new TextRun(" - Main container managing layout state and transitions")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "MainViewport.tsx", bold: true }), new TextRun(" - Dynamic content switcher with lazy loading")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "LeftSidebar.tsx", bold: true }), new TextRun(" - Collapsible widget stack for system status and quick actions")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "RightSidebar.tsx", bold: true }), new TextRun(" - Circular monitor displays for data visualization")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun({ text: "TopBar.tsx", bold: true }), new TextRun(" - Curved status bar with time, notifications, and system info")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_3, 
        children: [new TextRun("Widget Components")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "MetricsWidget.tsx", bold: true }), new TextRun(" - Reusable data visualization panels with Recharts")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "AlertWidget.tsx", bold: true }), new TextRun(" - Priority-based notification cards with zoom capability")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "CircularMonitor.tsx", bold: true }), new TextRun(" - Right sidebar circular displays for real-time metrics")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun({ text: "QuickAction.tsx", bold: true }), new TextRun(" - One-tap action buttons for common tasks")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_3, 
        children: [new TextRun("View Components")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("NewsfeedView.tsx - Social feed with infinite scroll")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("MessagingView.tsx - Real-time chat interface")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("MediaGalleryView.tsx - Media upload and management")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("MarketplaceView.tsx - Browse and list items")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 360 },
        children: [new TextRun("YouTubeView.tsx - Embedded video player")] 
      }),

      // Page break
      new Paragraph({ children: [new PageBreak()] }),

      // State Management
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("State Management Strategy")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("Zustand provides lightweight, performant state management without Redux boilerplate. The store is organized into logical slices for layout, content, panels, and alerts.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Store Structure")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Layout slice", bold: true }), new TextRun(" - Manages view modes and grid configurations")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Content slice", bold: true }), new TextRun(" - Controls active viewport content and routing")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Panel slice", bold: true }), new TextRun(" - Tracks visibility and size states for all panels")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun({ text: "Alert slice", bold: true }), new TextRun(" - Manages notification queue and focus state")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Context Providers")] 
      }),
      new Paragraph({ 
        spacing: { after: 120 },
        children: [new TextRun("EnclaveContext wraps the entire application, providing global access to state and actions. This eliminates prop drilling while maintaining type safety through TypeScript.")] 
      }),

      // Tech Stack Table
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Technology Stack")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("The following technologies were selected for their performance, developer experience, and ecosystem support.")] 
      }),

      new Table({
        columnWidths: [3120, 3120, 3120],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "E3F2FD", type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Feature", bold: true, size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "E3F2FD", type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Technology", bold: true, size: 22 })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                shading: { fill: "E3F2FD", type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Rationale", bold: true, size: 22 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Animations", bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Framer Motion")] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Smooth transitions, gesture support")] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Charts", bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Recharts")] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Customizable cyberpunk visualizations")] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "3D Elements", bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("React Three Fiber")] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Optional 3D monitors and effects")] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Video", bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("React Player")] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("YouTube embed support")] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "State", bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Zustand")] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Lightweight, no boilerplate")] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Styling", bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Tailwind + CSS Modules")] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Utility-first + scoped styles")] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Notifications", bold: true })] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("React Hot Toast")] })]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 3120, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun("Custom styled alerts")] })]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 360, after: 200 }, children: [new TextRun("")] }),

      // Page break
      new Paragraph({ children: [new PageBreak()] }),

      // Implementation Phases
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Implementation Phases")] 
      }),
      new Paragraph({ 
        spacing: { after: 280 },
        children: [new TextRun("Development is organized into four sequential phases, each building on the previous foundation. Each phase includes testing and optimization before moving forward.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Phase 1: Foundation & Shell")] 
      }),
      new Paragraph({ 
        spacing: { after: 120 },
        children: [new TextRun({ text: "Timeline: 2-3 days", bold: true })] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Build EnclaveShell component with adaptive grid system")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Implement view mode switching (Dashboard, Theater, Focus, Split)")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Create base panel components (LeftSidebar, RightSidebar, TopBar)")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Set up Zustand store with layout slice")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Configure TypeScript types and interfaces")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun("Implement basic Framer Motion transitions")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Phase 2: Content Views & Routing")] 
      }),
      new Paragraph({ 
        spacing: { after: 120 },
        children: [new TextRun({ text: "Timeline: 1 week", bold: true })] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Build individual view components (Newsfeed, Messaging, Gallery, Marketplace, YouTube)")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Implement content routing with React Router")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Add lazy loading for performance optimization")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Create widget components (Metrics, Alerts, Circular Monitors)")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Integrate Recharts for data visualizations")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun("Set up React Player for YouTube embeds")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Phase 3: Interactions & Animations")] 
      }),
      new Paragraph({ 
        spacing: { after: 120 },
        children: [new TextRun({ text: "Timeline: 3-4 days", bold: true })] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Implement panel zoom and focus system")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Build alert system with priority-based notifications")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Add smooth transitions between all states")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Implement gesture controls (swipe, pinch, drag)")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Create keyboard shortcuts for power users")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun("Add loading states and skeleton screens")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Phase 4: Polish & Cyberpunk Styling")] 
      }),
      new Paragraph({ 
        spacing: { after: 120 },
        children: [new TextRun({ text: "Timeline: 2-3 days", bold: true })] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Apply cyberpunk theme with CSS perspective effects")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Implement curved display styling with SVG filters")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Add glow effects and neon borders")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Create scan line and holographic effects")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Implement custom scrollbars and UI controls")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Optimize performance and bundle size")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        spacing: { after: 360 },
        children: [new TextRun("Conduct cross-browser testing and accessibility audit")] 
      }),

      // Page break
      new Paragraph({ children: [new PageBreak()] }),

      // Key Features Deep Dive
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Key Features Deep Dive")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Adaptive Viewport System")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("The MainViewport component dynamically switches content based on user navigation. A content registry maps route names to React components, enabling clean separation of concerns and lazy loading for performance.")] 
      }),
      new Paragraph({ 
        spacing: { after: 280 },
        children: [new TextRun("When switching content, the viewport performs a smooth fade-out, updates the component, and fades in. This transition takes 300ms and uses Framer Motion's easing curves for a polished feel.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Panel Zoom and Focus")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("Users can click any widget to trigger a zoom effect. The selected panel animates to the center of the screen while other panels fade out. This provides focused interaction without losing context.")] 
      }),
      new Paragraph({ 
        spacing: { after: 280 },
        children: [new TextRun("The zoom system maintains a history stack, allowing users to press ESC or click outside to return to the previous state. This creates an intuitive drill-down experience.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Curved Display Effects")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("The holographic curve effect uses CSS perspective transforms combined with SVG filters. The main viewport has a subtle 3D rotation that creates depth without impacting readability.")] 
      }),
      new Paragraph({ 
        spacing: { after: 280 },
        children: [new TextRun("Neon glow effects are achieved through multiple box-shadows with varying blur radii. The cyan and magenta color scheme creates the signature cyberpunk aesthetic.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Performance Optimizations")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Lazy loading", bold: true }), new TextRun(" - Views load only when accessed, reducing initial bundle size")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Virtualization", bold: true }), new TextRun(" - Long lists use React Virtual for smooth scrolling")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Throttling", bold: true }), new TextRun(" - Expensive operations like resize events are throttled")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Memoization", bold: true }), new TextRun(" - React.memo prevents unnecessary re-renders")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 360 },
        children: [new TextRun({ text: "Code splitting", bold: true }), new TextRun(" - Vite automatically splits code at route boundaries")] 
      }),

      // Interaction Flows
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Example Interaction Flows")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Alert Zoom Flow")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Alert widget pulses with Framer Motion animation")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("User clicks alert, triggering focusAlert action")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Other panels fade out and collapse")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Alert animates to center at 2x size")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Detail view displays with action buttons")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun("User dismisses or acts, returns to dashboard")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Content Switching Flow")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("User clicks Marketplace icon in sidebar")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Current content fades out over 150ms")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("Marketplace view lazy loads if not cached")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        children: [new TextRun("New content fades in over 150ms")] 
      }),
      new Paragraph({ 
        numbering: { reference: "phase-list", level: 0 },
        spacing: { after: 360 },
        children: [new TextRun("URL updates to /enclave/marketplace")] 
      }),

      // Page break
      new Paragraph({ children: [new PageBreak()] }),

      // Development Guidelines
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Development Guidelines")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Code Standards")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("TypeScript strict mode enabled for maximum type safety")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("ESLint and Prettier configured for consistent code style")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Component files follow PascalCase naming convention")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Hooks follow use prefix naming pattern")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun("Path aliases prevent relative import hell")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Testing Strategy")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Unit tests", bold: true }), new TextRun(" - Vitest for component logic and utilities")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Integration tests", bold: true }), new TextRun(" - React Testing Library for user flows")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "E2E tests", bold: true }), new TextRun(" - Playwright for critical paths")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun({ text: "Visual regression", bold: true }), new TextRun(" - Chromatic for UI changes")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Accessibility Checklist")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("WCAG 2.1 AA compliance minimum")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Keyboard navigation for all interactions")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Screen reader support with ARIA labels")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Color contrast ratios meet standards")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 360 },
        children: [new TextRun("Focus indicators visible on all interactive elements")] 
      }),

      // Success Metrics
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Success Metrics")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("The following metrics will be tracked to measure the success of the User Enclave implementation.")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("Performance Targets")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Initial load time", bold: true }), new TextRun(" - Under 2 seconds on 4G")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Time to interactive", bold: true }), new TextRun(" - Under 3 seconds")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Animation frame rate", bold: true }), new TextRun(" - Consistent 60 FPS")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 280 },
        children: [new TextRun({ text: "Bundle size", bold: true }), new TextRun(" - Initial chunk under 200KB gzipped")] 
      }),

      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("User Experience Goals")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("90% of users can complete primary tasks without assistance")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Average session duration increases by 25%")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Bounce rate decreases by 15%")] 
      }),
      new Paragraph({ 
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { after: 360 },
        children: [new TextRun("User satisfaction score above 4.5/5")] 
      }),

      // Conclusion
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("Next Steps")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("With this technical foundation in place, development can begin immediately on Phase 1. The EnclaveShell component will serve as the cornerstone for all subsequent work.")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun("Upon approval of this plan, the frontend development team will establish the project repository, configure the build pipeline, and begin implementing the core shell architecture.")] 
      }),
      new Paragraph({ 
        spacing: { after: 200 },
        children: [new TextRun({ text: "Estimated total development time: 2.5-3 weeks", bold: true, size: 26 })] 
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/mnt/user-data/outputs/AetherWave-Enclave-Planning-Document.docx', buffer);
  console.log('Planning document created successfully!');
});
