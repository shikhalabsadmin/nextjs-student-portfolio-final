import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ROUTES } from "@/config/routes";

const ProfileCompletionPrompt = () => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4 sm:px-6 md:px-8 py-10 mx-auto max-w-4xl text-center">
    <div className="w-full max-w-md">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
        Complete Your Profile
      </h2>
      <p className="mb-6 text-sm sm:text-base text-muted-foreground">
        Complete your profile to unlock personalized features and a tailored
        teaching experience designed just for you.
      </p>
      <Button className="w-full sm:w-auto" asChild>
        <Link to={ROUTES.TEACHER.PROFILE}>Complete Profile</Link>
      </Button>
    </div>
  </div>
);

export default ProfileCompletionPrompt;
