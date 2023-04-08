import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export default async function fillForm() {
	// const formPdfBytes = await fetch(characterSheet).then((res) => res.arrayBuffer());

	// const pdfDoc = await PDFDocument.load('$lib/assets/5E_CharacterSheet_Fillable.pdf');
	const uint8Array = fs.readFileSync(
		'/home/hagansna/projects/dnd-ai/src/lib/assets/5E_CharacterSheet_Fillable.pdf'
	);
	const pdfDoc = await PDFDocument.load(uint8Array);
	const form = pdfDoc.getForm();

	const nameField = form.getTextField('CharacterName 2');
	const ageField = form.getTextField('Age');
	const heightField = form.getTextField('Height');
	const weightField = form.getTextField('Weight');
	const eyesField = form.getTextField('Eyes');
	const skinField = form.getTextField('Skin');
	const hairField = form.getTextField('Hair');

	const alliesField = form.getTextField('Allies');
	const factionField = form.getTextField('FactionName');
	const backstoryField = form.getTextField('Backstory');
	const traitsField = form.getTextField('Feat+Traits');
	const treasureField = form.getTextField('Treasure');

	nameField.setText('Mario');
	ageField.setText('24 years');
	heightField.setText(`5' 1"`);
	weightField.setText('196 lbs');
	eyesField.setText('blue');
	skinField.setText('white');
	hairField.setText('brown');

	alliesField.setText(
		[
			`Allies:`,
			`  • Princess Daisy`,
			`  • Princess Peach`,
			`  • Rosalina`,
			`  • Geno`,
			`  • Luigi`,
			`  • Donkey Kong`,
			`  • Yoshi`,
			`  • Diddy Kong`,
			``,
			`Organizations:`,
			`  • Italian Plumbers Association`
		].join('\n')
	);

	factionField.setText(`Mario's Emblem`);

	backstoryField.setText(
		[
			`Mario is a fictional character in the Mario video game franchise, `,
			`owned by Nintendo and created by Japanese video game designer Shigeru `,
			`Miyamoto. Serving as the company's mascot and the eponymous `,
			`protagonist of the series, Mario has appeared in over 200 video games `,
			`since his creation. Depicted as a short, pudgy, Italian plumber who `,
			`resides in the Mushroom Kingdom, his adventures generally center `,
			`upon rescuing Princess Peach from the Koopa villain Bowser. His `,
			`younger brother and sidekick is Luigi.`
		].join('\n')
	);

	traitsField.setText(
		[
			`Mario can use three basic three power-ups:`,
			`  • the Super Mushroom, which causes Mario to grow larger`,
			`  • the Fire Flower, which allows Mario to throw fireballs`,
			`  • the Starman, which gives Mario temporary invincibility`
		].join('\n')
	);

	treasureField.setText(['• Gold coins', '• Treasure chests'].join('\n'));

	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}
