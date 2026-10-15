export function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD") // Split accented letters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}
