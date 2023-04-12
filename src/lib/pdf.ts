import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export default async function fillForm(chatInput: string, pdfKeys: string[]) {
	const parsedInput = parseInput(chatInput);
	const uint8Array = fs.readFileSync(
		`${process.cwd()}/src/lib/assets/5E_CharacterSheet_Fillable.pdf`
	);
	const pdfDoc = await PDFDocument.load(uint8Array);
	const form = pdfDoc.getForm();

	pdfKeys.forEach((pdfKey) => {
		const field = form.getTextField(pdfKey);
		console.log('pdfKey: ', pdfKey);
		console.log('value: ', parsedInput[pdfKey]);
		field.setText(String(parsedInput[pdfKey.trim()]));
	});
	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}

function parseInput(chatInput: string) {
	const re = /({[\s\S*]+})/i;
	const input = chatInput.match(re) ?? [];
	const jsonInput = input.length > 1 ? JSON.parse(input[1]) : {};
	return jsonInput;
}
