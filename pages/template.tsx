import { useState, useEffect, useCallback } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import TemplateHeader from "../components/TemplateHeader";
import TemplateMenuBar from "../components/SideMenu/TemplateMenuBar";
import { loadBlocks, loadTheme, loadEventListeners } from "../grapeJs";
import { IFont, IPalette, ITemplate } from "../interfaces";
import { useDialog, useUser } from "../hooks";
import UpsertTemplateDialog from "../components/UpsertTemplateDialog";
import {
  useSupabaseClient,
  useUser as useSupaUser,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import AuthDialog from "../components/AuthDialog";
import { editorPlugins } from "../grapeJs/editorPlugins";
import { loadTemplateData } from "../grapeJs/versions/loadTemplateData";
import { TEMPLATE_VERSION } from "../grapeJs/versions/constants";
import { MenuPDFExporter } from "../services/MenuExporter/MenuPDFExporter";
import {
  MENU_BODY_COMMANDS,
  MENU_BODY_SELECTOR,
} from "../grapeJs/components/MenuBody/constants";
import {
  SECTION_COMMANDS,
  SECTION_HEADING_ROW_SELECTOR,
} from "../grapeJs/components/Section/constants";

const DRAWER_WIDTH = "500px";

export const WRAPPER_PADDING = 10;

const Template = ({ drawerOpened }: { drawerOpened: boolean }) => {
  const [editor, setEditor] = useState<grapesjs.Editor | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<IPalette | null>(null);
  const [selectedColumnsPadding, setSelectedColumnsPadding] =
    useState<number>(0);
  const [selectedHorizontalPadding, setSelectedHorizontalPadding] =
    useState<number>(0);
  const [selectedVerticalPadding, setSelectedVerticalPadding] =
    useState<number>(0);
  const [selectedFont, setSelectedFont] = useState<IFont | null>(null);
  const [upsertTemplate, openUpsertTemplate, closeUpsertTemplate] =
    useDialog(false);
  const [template, setTemplate] = useState<ITemplate | null>(null);
  const [panelIsVisible, setPanelIsVisible] = useState(null);
  const [authDialog, openAuthDialog, closeAuthDialog] = useDialog(false);
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useUser();
  const supaUser = useSupaUser();

  useEffect(() => {
    setEditor(
      grapesjs.init({
        // Indicate where to init the editor. You can also pass an HTMLElement
        container: "#gjs",
        plugins: editorPlugins,
        // Disable the storage manager for the moment
        storageManager: false,
        deviceManager: {
          devices: [
            {
              name: "Letter",
              width: "8.5in",
              widthMedia: "",
              height: "11in",
            },
            {
              name: "Horizontal Letter",
              width: "11in",
              widthMedia: "",
              height: "8.5in",
            },
            {
              name: "Half Letter",
              width: "4.25in",
              widthMedia: "576px",
              height: "11in",
            },
            {
              name: "Quarter Letter",
              width: "4.25in",
              widthMedia: "420px",
              height: "5.5in",
            },
            {
              name: "Legal",
              width: "8.5in",
              widthMedia: "",
              height: "14in",
            },
            {
              name: "Horizontal Legal",
              width: "14in",
              widthMedia: "",
              height: "8.5in",
            },
            {
              name: "ARCH E",
              width: "36in",
              widthMedia: "",
              height: "48in",
            },
          ],
        },
        canvasCss: `
        [data-gjs-type="wrapper"] {
          padding: ${WRAPPER_PADDING}px;
          overflow: hidden;
        }
        `,
        panels: {
          defaults: [
            {
              id: "commands",
              visible: false,
            },
            {
              id: "options",
              visible: false,
            },
            {
              id: "views",
              visible: false,
            },
            {
              id: "devices-c",
              visible: false,
            },
            {
              id: "views-container",
              visible: false,
            },
          ],
        },
      })
    );
  }, []);

  useEffect(() => {
    if (!editor) return;

    // Views container panel Event listener
    editor?.Panels.getPanel("views-container")?.on(
      "change:visible",
      (_, isVisible) => setPanelIsVisible(isVisible)
    );

    // call loadBlocks whenever editor update
    loadBlocks(editor);

    if (!editor.getWrapper()) return;
    const wrapperFontSizeStr = editor.getWrapper().getStyle()[
      "font-size"
    ] as unknown as string | undefined;
    if (!wrapperFontSizeStr) return;
    const wrapperFontSize = parseInt(wrapperFontSizeStr);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bodyFontSize");
      sessionStorage.setItem("bodyFontSize", JSON.stringify(wrapperFontSize));
    }
  }, [editor]);

  // CHECKOUT API
  const checkoutCallback = useCallback(
    () =>
      fetch(`${window.location.origin}/api/checkout`, {
        method: "POST",
        body: JSON.stringify({ userId: user?.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          window.open(data.url, "_blank");
        }),
    [user?.id]
  );

  useEffect(() => {
    if (!editor) return;
    loadTheme(
      editor,
      selectedPalette,
      selectedFont,
      selectedColumnsPadding,
      selectedHorizontalPadding,
      selectedVerticalPadding,
      supabase
    );
  }, [
    editor,
    selectedFont,
    selectedPalette,
    selectedColumnsPadding,
    selectedHorizontalPadding,
    selectedVerticalPadding,
    supabase,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined" && selectedFont) {
      sessionStorage.removeItem("bodyFontSize");
      sessionStorage.setItem(
        "bodyFontSize",
        JSON.stringify(selectedFont?.bodyFontSize)
      );
    }
  }, [selectedFont]);

  // call loadEventListeners whenever editor update
  useEffect(() => {
    if (!editor) return;
    loadEventListeners(
      editor,
      user,
      openAuthDialog,
      checkoutCallback,
      supaUser
    );
  }, [editor, user, selectedFont, checkoutCallback, supaUser, openAuthDialog]);

  // attach hotjar to editor
  useEffect(() => {
    if (
      editor &&
      editor.Canvas.getDocument() &&
      !editor?.Canvas.getDocument().head.hasChildNodes()
    ) {
      var hotjarscript = editor.Canvas.getDocument().createElement("script");
      hotjarscript.innerHTML = `
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:3291123,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `;
      editor.Canvas.getDocument().head.appendChild(hotjarscript);
    }
  }, [editor]);

  // get template from exit menu from database
  const fetchTemplate = useCallback(
    async (id: string) => {
      try {
        const { data, error } = await supabase
          .from("templates")
          .select("name, description, content, isGlobal")
          .eq("id", id);
        if (error) throw error;
        if (editor) {
          const templateData = loadTemplateData(data[0].content);
          editor.loadProjectData(templateData);
          editor.setDevice(templateData.assets[0]);
          setTimeout(() => {
            const canvasDocument = editor.Canvas.getDocument();
            if (!canvasDocument) return;

            // Set vertical and horizontal padding to the toolbar
            const menuBody = canvasDocument.querySelector(MENU_BODY_SELECTOR);
            if (menuBody) {
              const prevHorizontalPadding =
                window.getComputedStyle(menuBody).paddingLeft;
              setSelectedHorizontalPadding(parseFloat(prevHorizontalPadding));
              const prevVerticalPadding =
                window.getComputedStyle(menuBody).paddingTop;
              setSelectedVerticalPadding(parseFloat(prevVerticalPadding));
            }

            // Set columns padding to the toolbar
            const sectionHeadingRow = canvasDocument.querySelector(
              `.section ${SECTION_HEADING_ROW_SELECTOR}`
            );
            if (sectionHeadingRow) {
              const prevColumnPadding =
                window.getComputedStyle(sectionHeadingRow).gap;
              setSelectedColumnsPadding(parseFloat(prevColumnPadding));
            }
          }, 2000);
        }
        setTemplate({
          ...data[0],
        });
      } catch (err) {
        console.error(err);
      }
    },
    [editor, supabase]
  );
  // call fetchTemplate
  useEffect(() => {
    if (editor && router.query.id) {
      fetchTemplate(router.query.id as string);
    }
  }, [editor, router.query.id, fetchTemplate]);

  // download template as pdf
  const onTemplateDownload = async () => {
    // NOTE: the logic is duplicated in the TemplateHeader
    if (user && user.subscriptionActive) {
      if (editor) {
        const selectedDevice = editor.Devices.getSelected();
        const fonts = Array.from(editor.Canvas.getDocument().fonts);
        const body = editor.Canvas.getBody();
        const { width, height }: { width: string; height: string } =
          selectedDevice.attributes;
        const styleSheets = editor.Canvas.getDocument().styleSheets;
        const fontsCSS = Array.from(styleSheets)
          .map((sheet) => {
            return Array.from(sheet.cssRules)
              .filter((rule) => rule.cssText.startsWith("@font-face"))
              .map((rule) => rule.cssText)
              .join("");
          })
          .join("");
        const exporter = new MenuPDFExporter(
          [body],
          parseFloat(width),
          parseFloat(height),
          { unit: "in" }
        );
        await exporter.export();
      }
    } else {
      openAuthDialog();
    }
  };

  const selectedPaletteChange = (palette: IPalette) =>
    setSelectedPalette(palette);

  const selectedFontChange = (font: IFont) => setSelectedFont(font);

  const selectedHorizontalPaddingChange = (padding: number) => {
    if (!editor) return;
    editor.runCommand(MENU_BODY_COMMANDS.UPDATE_HORIZONTAL_PADDING, {
      value: padding,
    });
    setSelectedHorizontalPadding(padding);
  };

  const selectedVerticalPaddingChange = (padding: number) => {
    if (!editor) return;
    editor.runCommand(MENU_BODY_COMMANDS.UPDATE_VERTICAL_PADDING, {
      value: padding,
    });
    setSelectedVerticalPadding(padding);
  };

  const selectedColumnsPaddingChange = (padding: number) => {
    if (!editor) return;
    editor.runCommand(SECTION_COMMANDS.UPDATE_COLUMN_PADDING, {
      value: padding,
    });
    setSelectedColumnsPadding(padding);
  };

  const onTemplateSaveUpdate = () => {
    if (user && user.subscriptionActive) {
      openUpsertTemplate();
    } else {
      openAuthDialog();
    }
  };
  // Hide dashed border for components
  var pn = editor?.Panels;
  pn?.getButton("options", "sw-visibility")?.set("active", false);

  // action on footer when click on delete key
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
      const signUpbtn = document.querySelector(".sign-up");
      if (
        e.key === "Delete" &&
        editor?.getSelected()?.getClasses().includes("footer-text")
      ) {
        if (!signUpbtn && user && !user.subscriptionActive) {
          e.preventDefault();
          checkoutCallback();
        }
        if (signUpbtn) {
          e.preventDefault();
          openAuthDialog();
        }
      }
    });
  }
  return (
    <>
      {editor && (
        <TemplateHeader
          onTemplateDownload={onTemplateDownload}
          onTemplateSaveUpdate={onTemplateSaveUpdate}
          editor={editor}
          template={template}
          upsertTemplate={upsertTemplate}
        />
      )}
      <AuthDialog opened={authDialog} onClose={closeAuthDialog} />
      {editor && (
        <TemplateMenuBar
          selectedFont={selectedFont}
          setSelectedFont={selectedFontChange}
          selectedPalette={selectedPalette}
          setSelectedPalette={selectedPaletteChange}
          selectedColumnsPadding={selectedColumnsPadding}
          setSelectedColumnsPadding={selectedColumnsPaddingChange}
          selectedHorizontalPadding={selectedHorizontalPadding}
          setSelectedHorizontalPadding={selectedHorizontalPaddingChange}
          selectedVerticalPadding={selectedVerticalPadding}
          setSelectedVerticalPadding={selectedVerticalPaddingChange}
          editor={editor}
          onTemplateDownload={onTemplateDownload}
          assetsTemplate={template?.content.assets}
        />
      )}
      {editor && upsertTemplate && (
        <UpsertTemplateDialog
          opened={upsertTemplate}
          onClose={closeUpsertTemplate}
          content={{
            ...editor.getProjectData(),
            assets: [
              editor.getDevice(),
              selectedPalette?.name,
              selectedFont?.name,
            ],
            meta: {
              version: TEMPLATE_VERSION,
            },
          }}
          template={template}
        />
      )}
      <div
        id="gjs"
        style={{
          paddingRight: drawerOpened ? DRAWER_WIDTH : "0px",
        }}
      />
    </>
  );
};

export default Template;
