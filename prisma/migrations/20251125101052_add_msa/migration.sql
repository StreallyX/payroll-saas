-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "extraFees" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "feePayer" TEXT,
ADD COLUMN     "payrollModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "portalCanUploadPaymentProof" BOOLEAN DEFAULT true,
ADD COLUMN     "portalCanUploadSelfBill" BOOLEAN DEFAULT true,
ADD COLUMN     "portalCanViewWorkers" BOOLEAN DEFAULT true,
ADD COLUMN     "proofOfPayment" BOOLEAN DEFAULT false,
ADD COLUMN     "requireDeposit" BOOLEAN DEFAULT false,
ADD COLUMN     "selfBilling" BOOLEAN DEFAULT false,
ADD COLUMN     "timesheetPolicy" TEXT;
