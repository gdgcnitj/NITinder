import ProfileOptions from "./modules/functional/ProfileOptions";
import PageLayout from "./modules/layout/PageLayout";

export default function Profile({onLogout}) {
  return (
    <PageLayout>
      <ProfileOptions onLogout={onLogout}/>
    </PageLayout>
  )
}