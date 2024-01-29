import {
  Avatar,
  Button,
  Flex,
  Header,
  Menu,
  Select,
  Text,
} from "@mantine/core";
import { useRouter } from "next/router";
import {
  IconChevronDown,
  IconDownload,
  IconLogout,
  IconMail,
} from "@tabler/icons";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import AuthDialog from "./AuthDialog";
import { useDialog, useUser, useUpsell } from "../hooks";
import { useWarnIfUnsaved } from "../hooks/useWarnIfUnsavedChanges";
import grapesjs from "grapesjs";
import Router from "next/router";
import { useEffect, useState } from "react";
import { ITemplate } from "../interfaces";
import _ from "lodash";
import { userCanEditFontAndColor } from "../helpers/userCanEditFontAndColor";
interface ITemplateHeaderProps {
  onTemplateDownload?: () => void;
  onTemplateSaveUpdate?: () => void;
  setNavMenu?: (value: string) => void;
  navMenu?: string;
  editor?: grapesjs.Editor;
  template?: ITemplate | null;
  upsertTemplate?: boolean;
}

const TemplateHeader = ({
  onTemplateDownload,
  onTemplateSaveUpdate,
  setNavMenu,
  navMenu,
  editor,
  template,
  upsertTemplate,
}: ITemplateHeaderProps) => {
  const router = useRouter();
  const user = useUser();
  const [authDialog, openAuthDialog, closeAuthDialog] = useDialog(false);
  const session = useSession();
  const supabase = useSupabaseClient();
  const [sizeValue, setSizeValue] = useState<string>();
  const { triggerUpsellOr } = useUpsell(user?.subscriptionActive, user?.id)

  if (typeof document !== "undefined") {
    const panelWrapper = document.querySelector<HTMLElement>(".gjs-pn-panels");
    const canvasWrapper = document.querySelector<HTMLElement>(".gjs-cv-canvas");
    const scrollableWrapper = document.querySelector<HTMLElement>('.scrollable-wrapper');

    if (scrollableWrapper !== null) {
      if (userCanEditFontAndColor(user)) {
        const LEFT_SPACE = '(4vw + 66px)';
        const RIGHT_SPACE = '200px';
        scrollableWrapper.style.width = `calc(100% - ${LEFT_SPACE} - ${RIGHT_SPACE})`;
      }

      // Update the canvas offset on scroll.
      // Without updating, the hover border and toolbox are misaligned with the item
      scrollableWrapper.addEventListener('scroll', () => {
        editor?.refresh();
      })
    }
    if (panelWrapper != null && canvasWrapper !== null) {
      if (user?.role === "flapjack") {
        canvasWrapper.style.position = 'relative';
        panelWrapper.style.display = "block";
      } else {
        canvasWrapper.style.position = 'relative';
        panelWrapper.style.display = "none";
      }

      canvasWrapper.style.top = "0";
    }
  }

  const activeClassFun = (value: string) => {
    // @ts-ignore
    navMenu && setNavMenu(value);
  };

  let editorEmpty = false;
  useEffect(() => {
    const reload = sessionStorage.getItem("reload");
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/templates" &&
      reload
    ) {
      // REMOVE SESSION RELOAD
      sessionStorage.removeItem("reload");
      editorEmpty = false;
    }
    //  IS EDITOR NOT BLANK

    if (window !== undefined) {
      Router.beforePopState(() => {
        let result = true;
        if (!!editor?.getWrapper().getEl().querySelector(".section")) {
          result = window.confirm(
            "You have unsaved changes. Are you sure you want to leave the page? All changes will be lost."
          );
          if (!result) {
            window.history.pushState("/templates", "");
            Router.push("/template");
          } else {
            editor?.DomComponents.clear();
          }
        }
        return result;
      });
    }
    return () => {
      if (window) {
        window.onbeforeunload = null;
        editor?.DomComponents.clear();
      }
      Router.beforePopState(() => {
        return true;
      });
    };
  }, []);

  let isConfirm = false;
  Router.events.on("routeChangeStart", () => {
    // ADD SESSION RELOAD
    const reload = sessionStorage.getItem("reload");
    editorEmpty =
      !reload &&
      window.location.pathname === "/template" &&
      !!editor?.getWrapper().getEl().querySelector(".section");
    if (
      (editor &&
        template?.content !== undefined &&
        editor?.getProjectData() &&
        window.location.pathname !== "/template" &&
        !_.isEqual(template?.content.pages, editor?.getProjectData().pages) &&
        !reload &&
        window.location.pathname !== "/templates") ||
      editorEmpty
    ) {
      sessionStorage.setItem("reload", "true");
    }
    // REMOVE PREVIOUS FROM FRESH EDITOR
    if (isConfirm && window.location.pathname === "/template") {
      editor?.DomComponents.clear();
    }
  });
  // check before unload function
  const checkUnloadEvent = (e: any) => {
    const reload = sessionStorage.getItem("reload");
    if (authDialog || upsertTemplate) {
      e.preventDefault();
    } else if (
      editor &&
      template?.content &&
      editor?.getProjectData() &&
      window.location.pathname !== "/template" &&
      !_.isEqual(template?.content.pages, editor?.getProjectData().pages) &&
      !reload &&
      window.location.pathname !== "/templates"
    ) {
      sessionStorage.setItem("reload", "true");
      e.returnValue = "Changes you made may not be saved.";
      sessionStorage.removeItem("reload");
    }
  };

  useEffect(() => {
    // Call function before load
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", checkUnloadEvent);
    }
    // Remove  event after once function called /* clean up */
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", checkUnloadEvent);
      }
    };
  });
  // canvas size function
  useEffect(() => {
    setSizeValue(template?.content.assets[0]);
  }, [template]);

  const handleSizeChange = (value: string) => {
    editor?.setDevice(value);
    setSizeValue(value);
  };
  return (
    <Header height={64}>
      <Flex
        p="md"
        sx={{ height: "100%" }}
        justify="space-between"
        align="center"
      >
        <Flex align="center">
          <svg
            width="31"
            height="29"
            viewBox="0 0 31 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.3546 28.2073C29.7323 27.928 30.6629 22.203 30.6629 20.8998C30.6629 19.5966 23.823 18.4795 15.3546 18.4795C6.88625 18.4795 0.0463867 19.55 0.0463867 20.8998C0.0463867 22.2496 0.976981 28.4865 15.3546 28.2073Z"
              fill="#FECB80"
            />
            <path
              d="M15.3548 25.7871C23.835 25.7871 30.7096 23.4323 30.7096 20.5276C30.7096 17.6228 23.835 15.2681 15.3548 15.2681C6.87457 15.2681 0 17.6228 0 20.5276C0 23.4323 6.87457 25.7871 15.3548 25.7871Z"
              fill="#EE6D01"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.3546 23.3667C29.7323 23.0874 30.6629 17.3625 30.6629 16.0592C30.6629 14.756 23.823 13.6389 15.3546 13.6389C6.88625 13.6389 0.0463867 14.7094 0.0463867 16.0592C0.0463867 17.3625 0.976981 23.5994 15.3546 23.3667Z"
              fill="#FECB80"
            />
            <path
              d="M15.3548 20.9465C23.835 20.9465 30.7096 18.5918 30.7096 15.687C30.7096 12.7823 23.835 10.4275 15.3548 10.4275C6.87457 10.4275 0 12.7823 0 15.687C0 18.5918 6.87457 20.9465 15.3548 20.9465Z"
              fill="#EE6D01"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.3546 18.4795C29.7323 18.2002 30.6629 12.4753 30.6629 11.172C30.6629 9.86877 23.823 8.75171 15.3546 8.75171C6.88625 8.75171 0.0463867 9.86877 0.0463867 11.172C0.0463867 12.4753 0.976981 18.7588 15.3546 18.4795Z"
              fill="#FECB80"
            />
            <path
              d="M15.3548 16.1523C23.835 16.1523 30.7096 13.7976 30.7096 10.8928C30.7096 7.98807 23.835 5.6333 15.3548 5.6333C6.87457 5.6333 0 7.98807 0 10.8928C0 13.7976 6.87457 16.1523 15.3548 16.1523Z"
              fill="#EE6D01"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.3546 13.6389C29.7323 13.3597 30.6629 7.63469 30.6629 6.33144C30.6629 5.0282 23.823 3.91113 15.3546 3.91113C6.88625 3.91113 0.0463867 4.98165 0.0463867 6.33144C0.0463867 7.68123 0.976981 13.9182 15.3546 13.6389Z"
              fill="#FECB80"
            />
            <path
              d="M15.3548 11.3118C23.835 11.3118 30.7096 8.957 30.7096 6.05224C30.7096 3.14749 23.835 0.792725 15.3548 0.792725C6.87457 0.792725 0 3.14749 0 6.05224C0 8.957 6.87457 11.3118 15.3548 11.3118Z"
              fill="#EE6D01"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.3547 3.25952C20.2403 3.25952 24.335 4.2835 24.9398 5.63329C24.9864 5.72638 25.0329 5.86601 25.0329 6.00564C25.0329 7.30889 22.9391 7.72779 21.7758 8.23978C21.4036 8.42595 21.1244 8.8914 21.0313 9.35684V21.3188C21.0313 22.4358 20.1473 23.3667 19.0306 23.3667H18.984C17.8673 23.3667 16.9367 22.4358 16.9367 21.3188V10.2877C16.7041 8.70522 14.3776 8.0536 13.7262 10.2877V13.8251C13.7262 14.9422 12.8421 15.8731 11.7254 15.8731H11.6789C10.5622 15.8731 9.63158 14.9887 9.63158 13.8717V13.8251V9.40339C9.63158 8.93794 9.39893 8.56559 8.8871 8.19323C7.90998 7.82088 5.63003 7.26234 5.5835 6.00564V5.9591V5.91255C5.72309 4.46968 10.0503 3.25952 15.3547 3.25952Z"
              fill="#BF360B"
            />
          </svg>
          <Text
            fw={700}
            ml={4}
            className="cursor-pointer"
            onClick={() => {
              router.push("/templates");
            }}
          >
            flapjack
          </Text>
          <Flex sx={{ marginLeft: "2rem" }}>
            {user && (
              <Text
                // navMenu "cursor-pointer"
                className={`myMenu ${navMenu === "myMenu" ? "active" : ""
                  } cursor-pointer`}
                fz="sm"
                onClick={() => {
                  router.push("/templates?myMenu");
                  activeClassFun("myMenu");
                }}
              >
                <span
                  style={{
                    padding: "6px 8px",
                    backgroundColor: "#EDF2FF",
                    borderRadius: "5px",
                    marginRight: "5px",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="#4C6EF5"
                    className="bi bi-file-earmark-text"
                    viewBox="0 0 16 16"
                    style={{ verticalAlign: "sub" }}
                  >
                    <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
                    <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                  </svg>
                </span>
                My Menus
              </Text>
            )}
            <Text
              className={`templates ${navMenu === "templates" ? "active" : ""
                } cursor-pointer`}
              fz="sm"
              ml="sm"
              onClick={() => {
                router.push("/templates");
                activeClassFun("templates");
              }}
            >
              <span
                style={{
                  padding: "6px 8px",
                  backgroundColor: "#FFF9DB",
                  borderRadius: "5px",
                  marginRight: "5px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="#FAB005"
                  className="bi bi-columns"
                  viewBox="0 0 16 16"
                  style={{ verticalAlign: "sub" }}
                >
                  <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2zm8.5 0v8H15V2H8.5zm0 9v3H15v-3H8.5zm-1-9H1v3h6.5V2zM1 14h6.5V6H1v8z" />
                </svg>
              </span>
              Templates
            </Text>
          </Flex>
        </Flex>
        {!router.pathname.includes("templates") && (
          <Flex align="center">
            <Select
              label="Size"
              placeholder="Pick one"
              defaultValue="Letter"
              size="xs"
              shadow="md"
              value={sizeValue}
              onChange={handleSizeChange}
              styles={(theme) => ({
                root: {
                  display: "flex",
                  alignItems: "center",
                },
                input: {
                  width: "190px",
                },
                label: {
                  marginRight: "10px",
                },
              })}
              data={[
                { value: "Letter", label: "Full Page (8.5 × 11 in)" },
                { value: "Horizontal Letter", label: "Full Page Landscape (11 x 8.5 in)" },
                { value: "Half Letter", label: "1/2 Page (4.5 × 11 in)" },
                { value: "Quarter Letter", label: "1/4 Page (4.5 × 5.5 in)" },
                { value: "Legal", label: "Legal (14 x 8.5 in)" },
                { value: "Horizontal Legal", label: "Legal Landscape (14 x 8.5 in)" },
                { value: "ARCH E", label: "Wall Poster (36 x 48 in)" },
              ]}
            />
          </Flex>
        )}
        <Flex align="center">
          {router.pathname.includes("templates") ? (
            user &&
            (user.subscriptionActive || user.role === "flapjack") && (
              <Button
                size="xs"
                color="orange"
                onClick={() => router.push("/template")}
                sx={{ marginRight: "1rem" }}
              >
                Create New Menu
              </Button>
            )
          ) : (
            <>
              <Button
                size="xs"
                variant="subtle"
                onClick={
                  session
                    ? triggerUpsellOr(
                      onTemplateDownload,
                    )
                    : openAuthDialog
                }
                sx={{
                  "&:hover": {
                    backgroundColor: "white",
                  },
                }}
              >
                <IconDownload />
              </Button>
            </>
          )}
          {onTemplateSaveUpdate && (
            <Button
              size="xs"
              color="orange"
              onClick={
                session
                  ? triggerUpsellOr(
                    onTemplateSaveUpdate,
                  )
                  : openAuthDialog
              }
              sx={{ marginRight: "1rem" }}
            >
              {router.query.id
                ? user?.role === "flapjack"
                  ? "Update"
                  : "Save Menu"
                : user
                  ? "Save"
                  : "Save Menu"}
            </Button>
          )}
          {session ? (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Flex align="center" sx={{ cursor: "pointer" }}>
                  <Avatar radius="xl" />
                  <IconChevronDown size={16} />
                </Flex>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Application</Menu.Label>
                <a
                  href="mailto:Howdy@Flapjack.co"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Menu.Item icon={<IconMail size={14} />}>
                    Contact Us
                  </Menu.Item>
                </a>
                <Menu.Item
                  icon={<IconLogout size={14} />}
                  onClick={() => supabase.auth.signOut()}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button
              onClick={openAuthDialog}
              color="orange"
              size="xs"
              className="sign-up"
            >
              Sign Up
            </Button>
          )}
          {authDialog && !session && (
            <AuthDialog opened={authDialog} onClose={closeAuthDialog} />
          )}
        </Flex>
      </Flex>
    </Header>
  );
};

export default TemplateHeader;
