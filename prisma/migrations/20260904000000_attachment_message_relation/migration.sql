-- AddForeignKey
ALTER TABLE "AiAttachment" ADD CONSTRAINT "AiAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

