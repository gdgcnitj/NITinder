import ProfileOptions from "./children/modules/functional/ProfilePage/ProfileOptions";
import PageLayout from "./children/modules/layout/PageLayout";

export default function Profile({onLogout}) {
  return (
    <PageLayout>
      <ProfileOptions onLogout={onLogout}/>
    </PageLayout>
  )
}