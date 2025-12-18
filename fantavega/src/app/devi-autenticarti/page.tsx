import React from "react";

import { Navbar } from "@/components/navbar";

const AuthenticationRequiredPage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <h1>&quot;Devi Autenticarti&quot;</h1>
      <p>&quot;Devi autenticarti per accedere a questa pagina.&quot;</p>
    </div>
  );
};

export default AuthenticationRequiredPage;
