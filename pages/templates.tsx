import React, { useEffect, useState } from "react";
import TemplateHeader from "../components/TemplateHeader";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import TemplateCard from "../components/TemplateGallery/TemplateCard";
import { Container, SimpleGrid, Text } from "@mantine/core";
import { GetServerSidePropsContext } from "next";
import { ITemplateDetails } from "../interfaces/ITemplate";
import { useUser, useTemplateActions } from "../hooks";
import { useRouter } from 'next/router';


const Templates = ({
  data,
  thumbnails,
}: {
  data: ITemplateDetails[];
  thumbnails: string[];
}) => {
  const router = useRouter()
  const [templates, setTemplates] = useState<ITemplateDetails[]>(data);
  const [navMenu, setNavMenu] = useState("templates");
  const user = useUser();
  const { deleteTemplate, renameTemplate, duplicateTemplate, globalTemplate } = useTemplateActions(
    templates,
    setTemplates,
    setNavMenu
  );

  // Fix `My Menu` button on the template page temporarily.
  // The better way is creating a separate `My Menu` page.
  useEffect(() => {
    if (router.isReady && Object.hasOwn(router.query, 'myMenu')) {
      setNavMenu('myMenu')
    }
  }, [router]);

  return (
    <>
      <TemplateHeader setNavMenu={setNavMenu} navMenu={navMenu} />
      <Container size="xl" px="xl" pt={16}>
        <Text size={32} weight={200} sx={{ marginBottom: "1rem" }}>
          {router.query.myMenu && navMenu === "templates" ? "" : "My Menus"}
        </Text>
        <SimpleGrid cols={3}
          breakpoints={[
            { maxWidth: 1120, cols: 3, spacing: 'md' },
            { maxWidth: 991, cols: 2, spacing: 'sm' },
            { maxWidth: 600, cols: 1, spacing: 'sm' },
          ]}
        >
          {templates
            ?.filter((template) => {
              if (navMenu === "templates") {
                if (template.isGlobal) {
                  return true;
                } else {
                  return false;
                }
              } else {
                if (template.createdBy === user?.id && !template.isGlobal) {
                  return true;
                } else {
                  return false;
                }
              }
            })
            .map((template: any, i: number) => (
              <TemplateCard
                key={i}
                template={template}
                thumbnail={thumbnails[template.id]}
                onRemove={deleteTemplate}
                onRename={renameTemplate}
                onDuplicate={duplicateTemplate}
                //@ts-ignore
                onGlobal={globalTemplate}
              />
            ))}
        </SimpleGrid>
      </Container>
    </>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient(context);
  const { data } = await supabase.from("templates")
    .select("id, createdBy, name, description, tags, isGlobal, menuSize")
    .order('templateOrder', { ascending: true });

  let { data: folders } = await supabase.storage.from("renderings").list();
  let thumbnails: any = {};
  folders?.forEach(async (folder) => {
    const { data: images } = await supabase.storage
      .from("renderings")
      .getPublicUrl(`${folder.name}/1.jpg`);
    thumbnails[folder.name] = images.publicUrl;
  })
  return {
    props: { data, thumbnails }, // will be passed to the page component as props
  };
}
export default Templates;
