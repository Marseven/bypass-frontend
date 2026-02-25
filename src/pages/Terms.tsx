import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Conditions d'utilisation</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Politique et conditions d'utilisation du système Bypass Guard</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Conditions d'utilisation</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
            {/* Bouton retour */}
            <Button variant="outline" size="icon" className="flex-shrink-0 rounded-full w-10 h-10" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions générales d'utilisation</CardTitle>
          <CardDescription>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">1. Acceptation des conditions</h2>
              <p className="text-muted-foreground">
                En accédant et en utilisant le système Bypass Guard, vous acceptez d'être lié par ces conditions d'utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser ce système.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">2. Utilisation du système</h2>
              <p className="text-muted-foreground">
                Le système Bypass Guard est destiné à la gestion sécurisée des demandes de bypass. Vous vous engagez à :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Utiliser le système uniquement dans le cadre de vos fonctions professionnelles</li>
                <li>Respecter les procédures et protocoles de sécurité établis</li>
                <li>Fournir des informations exactes et complètes dans vos demandes</li>
                <li>Maintenir la confidentialité de vos identifiants de connexion</li>
                <li>Ne pas partager votre compte avec d'autres personnes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">3. Responsabilités</h2>
              <p className="text-muted-foreground">
                Vous êtes responsable de toutes les activités effectuées sous votre compte. 
                L'administration se réserve le droit de suspendre ou de désactiver tout compte en cas de violation de ces conditions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">4. Confidentialité et sécurité</h2>
              <p className="text-muted-foreground">
                Toutes les informations traitées dans ce système sont confidentielles. Vous vous engagez à :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Respecter la confidentialité des données auxquelles vous avez accès</li>
                <li>Ne pas divulguer d'informations sensibles en dehors du système</li>
                <li>Signaler immédiatement tout problème de sécurité suspecté</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">5. Modifications des conditions</h2>
              <p className="text-muted-foreground">
                L'administration se réserve le droit de modifier ces conditions à tout moment. 
                Les utilisateurs seront informés des modifications importantes par notification dans le système.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">6. Contact</h2>
              <p className="text-muted-foreground">
                Pour toute question concernant ces conditions d'utilisation, veuillez contacter l'administration du système.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;
