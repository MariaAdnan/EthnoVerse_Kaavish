export function renderLabelContent(container, title, description) {
  const document = container.ownerDocument;
  const heading = document.createElement('strong');
  heading.textContent = title;

  container.replaceChildren(heading);
  if (description) {
    const paragraph = document.createElement('p');
    paragraph.textContent = description;
    container.append(paragraph);
  }
}
