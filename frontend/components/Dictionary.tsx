import React, { useState, useMemo } from 'react';
import { Search, Book, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DictionaryTerm {
  id: number;
  term: string;
  definition: string;
}

const legalTerms: DictionaryTerm[] = [
  { id: 1, term: "Abatement", definition: "A reduction or decrease, often in taxes or legal claims. It can also refer to ending a nuisance." },
  { id: 2, term: "Acquittal", definition: "A legal judgment that officially clears a defendant of criminal charges. No further prosecution on that charge." },
  { id: 3, term: "Adjudicate", definition: "To make a formal judgment or decision in a legal case. Often used for court or tribunal decisions." },
  { id: 4, term: "Affidavit", definition: "A written, sworn statement used as evidence in court. Must be signed under oath before a notary." },
  { id: 5, term: "Alibi", definition: "A defense claim that the accused was elsewhere during the crime. Used to prove innocence." },
  { id: 6, term: "Allegation", definition: "A claim made without proof, often in lawsuits or criminal charges. Requires evidence to be substantiated." },
  { id: 7, term: "Appeal", definition: "A legal request to review a lower court's decision. Filed to a higher court for reconsideration." },
  { id: 8, term: "Arbitration", definition: "A private dispute resolution process outside court. A neutral third party gives a binding decision." },
  { id: 9, term: "Arraignment", definition: "The first court appearance where charges are formally presented. The defendant pleads guilty or not guilty." },
  { id: 10, term: "Assets", definition: "Property or resources owned by a person or entity. Includes cash, real estate, or investments." },
  { id: 11, term: "Bail", definition: "A monetary deposit to ensure a defendant returns for trial. It allows temporary release from custody." },
  { id: 12, term: "Bankruptcy", definition: "A legal process for individuals or businesses unable to pay debts. It involves asset liquidation or restructuring." },
  { id: 13, term: "Battery", definition: "The unlawful use of force against another person. Often paired with assault in criminal law." },
  { id: 14, term: "Breach of Contract", definition: "Failure to fulfill a legal agreement's terms. The injured party may seek compensation or enforcement." },
  { id: 15, term: "Brief", definition: "A written document presenting legal arguments in a case. Submitted to courts before hearings or trials." },
  { id: 16, term: "Burden of Proof", definition: "The obligation to prove one's claim or defense. In criminal cases, it rests with the prosecution." },
  { id: 17, term: "Case Law", definition: "Law derived from previous judicial decisions. Forms part of common law traditions." },
  { id: 18, term: "Causation", definition: "The legal link between conduct and result (e.g. harm). Necessary for proving liability in tort law." },
  { id: 19, term: "Caveat", definition: "A warning or caution, especially in legal agreements. Can stop proceedings temporarily if filed." },
  { id: 20, term: "Civil Law", definition: "The branch of law dealing with private disputes. Includes contracts, property, and family matters." },
  { id: 21, term: "Class Action", definition: "A lawsuit filed by one on behalf of many. Often used in consumer rights or labor cases." },
  { id: 22, term: "Clause", definition: "A specific section in a contract or legal document. Defines obligations, rights, or conditions." },
  { id: 23, term: "Common Law", definition: "Law based on judicial precedents rather than statutes. Evolved through court decisions over time." },
  { id: 24, term: "Complainant", definition: "The person who files a complaint in a legal case. Also called the plaintiff in civil cases." },
  { id: 25, term: "Consideration", definition: "Something of value exchanged in a contract. Essential for a contract to be enforceable." },
  { id: 26, term: "Contempt of Court", definition: "Disrespecting or disobeying court rules. Can lead to fines or jail time." },
  { id: 27, term: "Contract", definition: "A legally binding agreement between parties. Enforceable in court if broken." },
  { id: 28, term: "Conviction", definition: "A formal declaration of guilt in criminal law. Follows a trial or a guilty plea." },
  { id: 29, term: "Counsel", definition: "A lawyer or legal advisor in a case. Can refer to a team of attorneys as well." },
  { id: 30, term: "Damages", definition: "Monetary compensation awarded for harm or loss. Can be compensatory, punitive, or nominal." },
  { id: 31, term: "Deed", definition: "A legal document for transferring ownership, usually of property. Must be signed and delivered." },
  { id: 32, term: "Defendant", definition: "The person or entity being sued or charged. Opposes the plaintiff or prosecution." },
  { id: 33, term: "Deposition", definition: "Sworn out-of-court testimony used in litigation. Taken before trial to gather evidence." },
  { id: 34, term: "Discovery", definition: "Pre-trial phase where parties exchange evidence. Ensures transparency and fair preparation." },
  { id: 35, term: "Dismissal", definition: "Termination of a legal case without trial. Can be voluntary or by court order." },
  { id: 36, term: "Docket", definition: "A court's schedule of cases. Lists upcoming hearings and case progress." },
  { id: 37, term: "Due Diligence", definition: "Careful investigation before a legal decision or contract. Common in mergers or real estate." },
  { id: 38, term: "Due Process", definition: "Legal guarantee of fair treatment and procedure. Protected under constitutional law." },
  { id: 39, term: "Easement", definition: "A legal right to use someone else's land. Often used for utilities or access." },
  { id: 40, term: "Emancipation", definition: "A minor legally becoming independent from parents. Grants adult legal rights." },
  { id: 41, term: "Eminent Domain", definition: "Government's right to take private land for public use. Requires fair compensation." },
  { id: 42, term: "Escrow", definition: "Holding of funds or documents by a third party. Released when all conditions are met." },
  { id: 43, term: "Estoppel", definition: "Prevents a party from contradicting previous statements. Ensures consistency in legal claims." },
  { id: 44, term: "Evidence", definition: "Information used to prove or disprove claims. Can be documents, testimony, or physical items." },
  { id: 45, term: "Felony", definition: "A serious criminal offense punishable by more than a year in prison. Includes murder, arson, etc." },
  { id: 46, term: "Fiduciary", definition: "A person who must act in another's best interest. Common in trusts or financial matters." },
  { id: 47, term: "Foreclosure", definition: "Legal process where a lender seizes a mortgaged property. Happens when payments are missed." },
  { id: 48, term: "Garnishment", definition: "Withholding a portion of wages to pay a debt. Ordered by court, often for child support." },
  { id: 49, term: "Guardian", definition: "A person appointed to care for another, usually a minor. Has legal responsibility and authority." },
  { id: 50, term: "Habeas Corpus", definition: "Legal action requiring a person to be brought before a court. Prevents unlawful detention." },
  { id: 51, term: "Hearing", definition: "A court session for presenting arguments or evidence. Not as formal as a full trial." },
  { id: 52, term: "Hearsay", definition: "Secondhand evidence not based on direct knowledge. Generally inadmissible in court unless exceptions apply." },
  { id: 53, term: "Heir", definition: "A person legally entitled to inherit property. Usually determined by a will or law." },
  { id: 54, term: "Holding", definition: "The legal principle established in a court's decision. Forms the precedent in future cases." },
  { id: 55, term: "Impeachment", definition: "Process of removing a public official for misconduct. Also means challenging a witness's credibility." },
  { id: 56, term: "Inadmissible", definition: "Evidence or testimony not allowed in court. Violates rules of evidence or procedure." },
  { id: 57, term: "Indemnity", definition: "Compensation for harm or loss. Often includes a promise to cover legal liability." },
  { id: 58, term: "Indictment", definition: "A formal charge issued by a grand jury. Begins criminal prosecution in serious cases." },
  { id: 59, term: "Injunction", definition: "Court order to stop or require an action. Used to prevent ongoing or future harm." },
  { id: 60, term: "Inquest", definition: "A legal inquiry into the cause of a death. Often done by a coroner or judge." },
  { id: 61, term: "Insolvency", definition: "When a person or business can't pay debts. Can lead to bankruptcy proceedings." },
  { id: 62, term: "Intent", definition: "A person's state of mind when committing an act. Essential in proving criminal liability." },
  { id: 63, term: "Interrogatories", definition: "Written questions one party sends to another in a lawsuit. Must be answered under oath." },
  { id: 64, term: "Intestate", definition: "Dying without a valid will. The estate is distributed by default laws." },
  { id: 65, term: "Joinder", definition: "Combining multiple legal claims or parties in one case. Promotes efficiency and consistency." },
  { id: 66, term: "Judgment", definition: "The final decision of a court in a case. Can involve liability, penalties, or orders." },
  { id: 67, term: "Jurisdiction", definition: "A court's authority to hear a case. Based on geography, subject, or person involved." },
  { id: 68, term: "Juror", definition: "A citizen selected to serve on a jury. Helps decide the facts in a trial." },
  { id: 69, term: "Just Cause", definition: "A legally valid reason for an action. Often used in employment or eviction cases." },
  { id: 70, term: "Larceny", definition: "The unlawful taking of someone's personal property. A form of theft under criminal law." },
  { id: 71, term: "Lawsuit", definition: "A legal action brought to resolve a dispute. Filed in civil court between individuals or entities." },
  { id: 72, term: "Lease", definition: "A legal contract to rent property. Sets terms between landlord and tenant." },
  { id: 73, term: "Legal Aid", definition: "Free or low-cost legal services for those in need. Provided by government or nonprofits." },
  { id: 74, term: "Liability", definition: "Legal responsibility for one's actions or omissions. Can result in damages or penalties." },
  { id: 75, term: "Lien", definition: "A legal claim against property for debt payment. Must be satisfied before transfer or sale." },
  { id: 76, term: "Litigation", definition: "The process of taking legal action in court. Includes lawsuits, motions, and hearings." },
  { id: 77, term: "Malfeasance", definition: "Intentional wrongdoing by a public official. Abuse or misuse of lawful authority." },
  { id: 78, term: "Mandamus", definition: "A court order directing a public official to act. Enforces performance of a legal duty." },
  { id: 79, term: "Mediation", definition: "A non-binding resolution method with a neutral third party. Aims to settle disputes out of court." },
  { id: 80, term: "Mens Rea", definition: "Latin for \"guilty mind\"; the intent to commit a crime. Required to prove most crimes." },
  { id: 81, term: "Misdemeanor", definition: "A less serious crime than a felony. Punishable by fines or jail under one year." },
  { id: 82, term: "Mitigation", definition: "Efforts to reduce the severity of harm or punishment. Often affects sentencing or liability." },
  { id: 83, term: "Motion", definition: "A formal request made to the court. Can ask for dismissal, evidence exclusion, or other relief." },
  { id: 84, term: "Negligence", definition: "Failure to act with reasonable care. Often the basis for personal injury lawsuits." },
  { id: 85, term: "Notary Public", definition: "An official who verifies identities and witnesses documents. Common in affidavits and contracts." },
  { id: 86, term: "Nuisance", definition: "An activity interfering with others' rights, especially property. Can be private or public." },
  { id: 87, term: "Oath", definition: "A sworn promise to tell the truth or fulfill a duty. Taken seriously in legal settings." },
  { id: 88, term: "Objection", definition: "A challenge to evidence or procedure during a trial. Must be ruled on by the judge." },
  { id: 89, term: "Parole", definition: "Conditional early release from prison. Requires compliance with specific terms." },
  { id: 90, term: "Party", definition: "A person or entity involved in a legal case. Includes plaintiffs, defendants, and intervenors." },
  { id: 91, term: "Perjury", definition: "Lying under oath in a legal setting. A criminal offense punishable by law." },
  { id: 92, term: "Plaintiff", definition: "The person who brings a lawsuit. Seeks remedy for harm or rights violation." },
  { id: 93, term: "Plea Bargain", definition: "An agreement where the defendant pleads guilty for a reduced charge. Speeds up the legal process." },
  { id: 94, term: "Power of Attorney", definition: "Legal authority to act on someone else's behalf. Can be general or limited." },
  { id: 95, term: "Precedent", definition: "A prior court decision used to guide future cases. Core to common law systems." },
  { id: 96, term: "Probate", definition: "Legal process of administering a deceased person's estate. Validates the will and distributes assets." },
  { id: 97, term: "Pro Bono", definition: "Legal work done for free or reduced fee. Offered to clients who cannot afford it." },
  { id: 98, term: "Prosecutor", definition: "Government attorney who brings criminal charges. Represents the state in criminal trials." },
  { id: 99, term: "Quash", definition: "To reject or void a legal action or order. Common for subpoenas or indictments." },
  { id: 100, term: "Statute", definition: "A law passed by a legislature. Written and codified into legal codes." }
];

interface DictionaryProps {
  onBack?: () => void;
}

export function Dictionary({ onBack }: DictionaryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Filter terms based on search and selected letter
  const filteredTerms = useMemo(() => {
    let filtered = legalTerms;

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(term => 
        term.term.toLowerCase().includes(search) || 
        term.definition.toLowerCase().includes(search)
      );
    }

    // Filter by selected letter
    if (selectedLetter) {
      filtered = filtered.filter(term => 
        term.term.toLowerCase().startsWith(selectedLetter.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, selectedLetter]);

  // Get unique first letters for alphabet navigation
  const availableLetters = useMemo(() => {
    const letters = new Set(legalTerms.map(term => term.term.charAt(0).toUpperCase()));
    return Array.from(letters).sort();
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLetter(null);
  };

  const highlightSearchTerm = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-400 text-black px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button
              onClick={onBack}
              className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
              <Book className="w-8 h-8 text-purple-400" />
              <span>Legal Dictionary</span>
            </h1>
            <p className="text-gray-400 mt-1">
              100 essential legal terms explained in plain English
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-purple-500 text-purple-400">
          {filteredTerms.length} terms
        </Badge>
      </div>

      {/* Search Bar */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search legal terms or definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </div>
          {(searchTerm || selectedLetter) && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                {searchTerm && (
                  <span>Search: "{searchTerm}"</span>
                )}
                {selectedLetter && (
                  <span>Letter: {selectedLetter}</span>
                )}
              </div>
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-white bg-gray-800 hover:bg-gray-700"
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alphabet Navigation */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {availableLetters.map((letter) => (
              <Button
                key={letter}
                onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                variant={selectedLetter === letter ? "default" : "outline"}
                size="sm"
                className={
                  selectedLetter === letter
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
                }
              >
                {letter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terms List */}
      {filteredTerms.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No terms found</h3>
            <p className="text-gray-400">
              Try adjusting your search or clearing the filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTerms.map((term) => (
            <Card key={term.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">
                  {highlightSearchTerm(term.term, searchTerm)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  {highlightSearchTerm(term.definition, searchTerm)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <Card className="bg-blue-950/30 border-blue-800/30">
        <CardContent className="p-4">
          <div className="text-blue-100 text-sm">
            <p className="font-medium mb-1">💡 How to Use the Dictionary</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Search:</strong> Type any term or part of a definition to find relevant entries</li>
              <li>• <strong>Browse by letter:</strong> Click any letter to see all terms starting with that letter</li>
              <li>• <strong>Highlighted results:</strong> Search terms are highlighted in yellow for easy spotting</li>
              <li>• <strong>Plain English:</strong> All definitions are written in simple, understandable language</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
